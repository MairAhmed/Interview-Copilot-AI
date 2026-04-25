import os
import asyncio
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import anthropic
from dotenv import load_dotenv

from services.transcription import transcribe_audio
from agents import technical, communication, confidence, synthesizer, resume as resume_agent
from models import AnalysisResult, TranscriptSegment, AgentScore, TimelineMoment, FillerWordCount

# Load .env from project root (one level above backend/)
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

app = FastAPI(title="Interview Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=4)

def get_client():
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")
    return anthropic.Anthropic(api_key=key)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(
    file: UploadFile = File(...),
    interview_type: str = Form(default="general")
):
    audio_bytes = await file.read()
    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio file too small or empty")

    loop = asyncio.get_event_loop()

    # Step 1: Transcribe
    try:
        transcription = await loop.run_in_executor(
            executor, transcribe_audio, audio_bytes, file.filename or "audio.webm"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    segments = transcription["segments"]
    full_text = transcription["full_text"]
    duration = transcription["duration"]

    if not full_text.strip():
        raise HTTPException(status_code=400, detail="No speech detected in audio")

    client = get_client()

    # Step 2: Run 3 specialist agents concurrently
    def run_technical():
        return technical.run(segments, full_text, interview_type, client)

    def run_communication():
        return communication.run(segments, full_text, interview_type, client)

    def run_confidence():
        return confidence.run(segments, full_text, interview_type, client)

    tech_future = loop.run_in_executor(executor, run_technical)
    comm_future = loop.run_in_executor(executor, run_communication)
    conf_future = loop.run_in_executor(executor, run_confidence)

    try:
        tech_result, comm_result, (conf_result, filler_counts) = await asyncio.gather(
            tech_future, comm_future, conf_future
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent analysis failed: {str(e)}")

    # Step 3: Synthesizer
    def run_synthesizer():
        return synthesizer.run(tech_result, comm_result, conf_result, filler_counts, full_text, interview_type, client)

    try:
        synth_result = await loop.run_in_executor(executor, run_synthesizer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")

    # Step 4: Build response
    scores = {
        "technical": AgentScore(
            score=tech_result["score"],
            summary=tech_result["summary"],
            strengths=tech_result.get("strengths", []),
            weaknesses=tech_result.get("weaknesses", []),
            moments=[TimelineMoment(**m) for m in tech_result.get("moments", [])]
        ),
        "communication": AgentScore(
            score=comm_result["score"],
            summary=comm_result["summary"],
            strengths=comm_result.get("strengths", []),
            weaknesses=comm_result.get("weaknesses", []),
            moments=[TimelineMoment(**m) for m in comm_result.get("moments", [])]
        ),
        "confidence": AgentScore(
            score=conf_result["score"],
            summary=conf_result["summary"],
            strengths=conf_result.get("strengths", []),
            weaknesses=conf_result.get("weaknesses", []),
            moments=[TimelineMoment(**m) for m in conf_result.get("moments", [])]
        ),
    }

    overall = round(
        (tech_result["score"] * 0.4 + comm_result["score"] * 0.35 + conf_result["score"] * 0.25),
        1
    )

    return AnalysisResult(
        transcript=[TranscriptSegment(**s) for s in segments],
        full_text=full_text,
        scores=scores,
        overall_score=overall,
        action_plan=synth_result.get("action_plan", []),
        summary=synth_result.get("overall_summary", ""),
        filler_words=[FillerWordCount(**f) for f in filler_counts],
        interview_type=interview_type,
        duration=duration,
    )


@app.post("/generate-questions")
async def generate_questions(
    file: UploadFile = File(...),
    interview_type: str = Form(default="general")
):
    """
    Accept a resume (PDF or plain text) and return 5 tailored interview questions.
    """
    file_bytes = await file.read()
    filename   = (file.filename or "").lower()

    # ── Extract text ─────────────────────────────────────────────────────────────
    resume_text = ""
    if filename.endswith(".pdf"):
        try:
            import pypdf, io
            reader      = pypdf.PdfReader(io.BytesIO(file_bytes))
            resume_text = "\n".join(
                page.extract_text() or "" for page in reader.pages
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not parse PDF: {e}")
    else:
        try:
            resume_text = file_bytes.decode("utf-8", errors="replace")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode file as text")

    resume_text = resume_text.strip()
    if not resume_text:
        raise HTTPException(status_code=400, detail="No text could be extracted from the file")

    client = get_client()
    loop   = asyncio.get_event_loop()

    try:
        result = await loop.run_in_executor(
            executor,
            lambda: resume_agent.run(resume_text, interview_type, client)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {e}")

    return result


@app.post("/transcribe-only")
async def transcribe_only(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            executor, transcribe_audio, audio_bytes, file.filename or "audio.webm"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
