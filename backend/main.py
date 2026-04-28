import os
import asyncio
import json
import base64
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, RedirectResponse
from pydantic import BaseModel
import anthropic
from dotenv import load_dotenv

# Allow OAuth over plain HTTP in local dev
os.environ.setdefault('OAUTHLIB_INSECURE_TRANSPORT', '1')

from services.transcription import transcribe_audio
from agents import technical, communication, confidence, synthesizer, resume as resume_agent
from agents import email_parser
from services.gmail import create_auth_url, pop_flow, fetch_interview_emails
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


class AIInterviewMessage(BaseModel):
    role: str   # "interviewer" | "user"
    text: str

class AIInterviewRequest(BaseModel):
    messages: list[AIInterviewMessage]
    interview_type: str = "general"
    exchange_count: int = 0

@app.post("/ai-interview")
async def ai_interview_chat(body: AIInterviewRequest):
    """
    Real-time AI interviewer conversation. Returns Alex's next spoken line.
    """
    client = get_client()

    type_label = {
        "technical-swe": "Software Engineering",
        "behavioral": "Behavioral",
        "data-science": "Data Science",
        "product": "Product Management",
        "leadership": "Leadership",
        "finance": "Finance",
    }.get(body.interview_type, "general")

    system = f"""You are Alex, a professional interviewer at a top tech company conducting a {type_label} interview.

Personality: warm, confident, concise. You sound like a real human interviewer — not a chatbot.

Rules:
- Keep EVERY response to 1-3 sentences maximum. Never longer.
- Ask exactly ONE question per response.
- If no messages yet: greet the candidate by name if known, briefly introduce yourself, and ask your first question.
- After each candidate answer: either ask a natural follow-up OR smoothly transition to the next topic.
- After {5} total exchanges, close warmly: "That's all the questions I have for today. Thank you so much for your time — we'll be in touch soon."
- Never give feedback, scores, or coaching during the interview. Stay in character always.
- Sound conversational — vary your transitions ("Great.", "Interesting.", "Got it.", "Thanks for that.")"""

    claude_messages = []
    for m in body.messages:
        role = "assistant" if m.role == "interviewer" else "user"
        claude_messages.append({"role": role, "content": m.text})

    if not claude_messages:
        claude_messages = [{"role": "user", "content": "Begin the interview now."}]

    loop = asyncio.get_event_loop()
    def _call():
        return client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=150,
            system=system,
            messages=claude_messages,
        )
    response = await loop.run_in_executor(executor, _call)
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(response.content[0].text.strip())


class AskRequest(BaseModel):
    question: str
    context: str   # serialized summary of the result (scores + summary + top issues)

@app.post("/ask")
async def ask_claude(body: AskRequest):
    """
    Streaming coaching follow-up. Takes a user question + interview context,
    returns a concise, personalized coaching answer.
    """
    client = get_client()

    system = (
        "You are an expert interview coach. The user just completed an AI-graded mock interview. "
        "You have their results below. Answer their question in 2–4 sentences — be direct, specific, "
        "and actionable. Reference their actual scores or issues when relevant. No fluff."
        f"\n\nINTERVIEW RESULTS CONTEXT:\n{body.context}"
    )

    def stream():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=256,
            system=system,
            messages=[{"role": "user", "content": body.question}],
        ) as stream:
            for text in stream.text_stream:
                yield text

    return StreamingResponse(stream(), media_type="text/plain")


# ── Gmail OAuth endpoints ──────────────────────────────────────────────────────

def _gmail_configured() -> bool:
    return bool(os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"))

@app.get("/gmail/auth-url")
def gmail_auth_url():
    """Return the Google OAuth URL for the frontend to open in a popup."""
    if not _gmail_configured():
        raise HTTPException(status_code=501, detail="Gmail integration not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env")
    url = create_auth_url()
    return {"url": url}


@app.get("/gmail/callback")
async def gmail_callback(code: str = None, state: str = None, error: str = None):
    """
    Google redirects here after user grants access.
    Fetches emails, parses with Claude, then posts results back to the
    opener window via postMessage and closes the popup.
    """
    def _send(payload_dict: dict) -> HTMLResponse:
        payload_json = json.dumps(payload_dict)
        payload_b64  = base64.b64encode(payload_json.encode()).decode()
        html = f"""<!DOCTYPE html><html><body><script>
            try {{
                var data = JSON.parse(atob('{payload_b64}'));
                if (window.opener) {{ window.opener.postMessage(data, '*'); }}
            }} catch(e) {{}}
            window.close();
        </script></body></html>"""
        return HTMLResponse(html)

    if error or not code:
        return _send({"gmailError": error or "access_denied"})

    if not _gmail_configured():
        return _send({"gmailError": "not_configured"})

    try:
        # Reuse the exact flow object that generated the auth URL (carries the
        # PKCE code_verifier so Google's token exchange succeeds).
        flow = pop_flow(state) if state else None
        if flow is None:
            from services.gmail import get_flow as _get_flow
            flow = _get_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
    except Exception as e:
        return _send({"gmailError": f"token_exchange_failed: {e}"})

    loop = asyncio.get_event_loop()
    try:
        emails = await loop.run_in_executor(executor, lambda: fetch_interview_emails(credentials))
    except Exception as e:
        return _send({"gmailError": f"gmail_fetch_failed: {e}"})

    if not emails:
        return _send({"gmailInterviews": []})

    client = get_client()
    try:
        interviews = await loop.run_in_executor(
            executor, lambda: email_parser.run(emails, client)
        )
    except Exception as e:
        return _send({"gmailError": f"parse_failed: {e}"})

    return _send({"gmailInterviews": interviews})


@app.get("/gmail/status")
def gmail_status():
    return {"configured": _gmail_configured()}


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
