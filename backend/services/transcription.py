import whisper
import tempfile
import os

# Ensure ffmpeg is findable regardless of shell PATH state
_WINGET_LINKS = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links")
if os.path.isdir(_WINGET_LINKS) and _WINGET_LINKS not in os.environ.get("PATH", ""):
    os.environ["PATH"] = _WINGET_LINKS + os.pathsep + os.environ.get("PATH", "")

_model = None

def get_model():
    global _model
    if _model is None:
        print("Loading Whisper model (first time only)...")
        _model = whisper.load_model("base")
        print("Whisper model loaded.")
    return _model

def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    model = get_model()

    suffix = os.path.splitext(filename)[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path, word_timestamps=False, verbose=False)
        segments = [
            {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()}
            for seg in result["segments"]
        ]
        return {
            "segments": segments,
            "full_text": result["text"].strip(),
            "duration": segments[-1]["end"] if segments else 0,
        }
    finally:
        os.unlink(tmp_path)
