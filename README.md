# Interview Copilot AI

> **Know exactly why you didn't get the job.**

Most candidates leave interviews not knowing why they failed. Interview Copilot records, transcribes, and runs four specialized AI agents on your performance — giving you the exact feedback interviewers never share.

![Interview Copilot Dashboard](https://raw.githubusercontent.com/placeholder/screenshot-dashboard.png)

---

## What it does

Upload a recording from Zoom or Teams, practice live, or capture a real interview happening right now — then get a full breakdown across three dimensions:

| Dimension | Weight | What it catches |
|---|---|---|
| **Technical** | 40% | Concept accuracy, Big-O gaps, system design blind spots, edge cases |
| **Communication** | 35% | Bottom-heavy answers, rambling, missing closing statements, BLUF failures |
| **Confidence** | 25% | Filler words, hedging language, self-undermining phrases, upward inflection |

Every finding is timestamped to the exact second it happened in your recording.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│   Landing → Dashboard → Interview Room → Results         │
└──────────────────────┬──────────────────────────────────┘
                       │ POST /api/analyze
┌──────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend                       │
│                                                         │
│   Audio File → Whisper (local transcription)            │
│                       │                                 │
│          ┌────────────┼────────────┐                    │
│          ▼            ▼            ▼                    │
│   Technical      Communication  Confidence              │
│    Agent          Agent          Agent                  │
│   (Claude)       (Claude)       (Claude)                │
│          └────────────┬────────────┘                    │
│                       ▼                                 │
│               Synthesizer Agent                         │
│               (Claude) → Action Plan                    │
└─────────────────────────────────────────────────────────┘
```

**Four Claude agents run in parallel** via `asyncio.gather()` — Technical, Communication, and Confidence analyze simultaneously, then the Synthesizer combines all three into a ranked action plan. Full analysis in under 60 seconds.

---

## Features

- **Three recording modes** — Live practice with AI questions, upload any Zoom/Teams/phone recording, or capture a live meeting with system audio
- **Moment-by-moment timeline** — every flagged moment timestamped and clickable
- **Filler word detection** — exact counts of "I think", "um", "I guess", and more
- **Session history** — track improvement across sessions with trend charts
- **Improvement deltas** — see exactly how much each score moved from last session
- **Fully local** — Whisper runs on your machine, nothing leaves your computer except the Claude API call
- **Works with any interview type** — SWE, behavioral, PM, data science, finance, leadership

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Python 3.12+ |
| AI | Claude claude-sonnet-4-6 (4 agents) via Anthropic SDK |
| Transcription | OpenAI Whisper (runs locally, no API key needed) |
| Audio capture | Web MediaRecorder API + getDisplayMedia for system audio |

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- [ffmpeg](https://ffmpeg.org/) installed and on PATH
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

### 1. Clone the repo

```bash
git clone https://github.com/MairAhmed/interview-copilot.git
cd interview-copilot
```

### 2. Set up your API key

```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
```

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Run it

**Terminal 1 — Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## Project Structure

```
interview-copilot/
├── backend/
│   ├── main.py                  # FastAPI app, /analyze endpoint
│   ├── models.py                # Pydantic response models
│   ├── requirements.txt
│   ├── agents/
│   │   ├── technical.py         # Technical depth agent
│   │   ├── communication.py     # Communication structure agent
│   │   ├── confidence.py        # Confidence & filler word agent
│   │   └── synthesizer.py       # Combines all agents → action plan
│   └── services/
│       └── transcription.py     # Whisper audio transcription
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Marketing/onboarding page
│   │   │   ├── Dashboard.jsx    # Session history + trends
│   │   │   ├── Interview.jsx    # Recording + live practice
│   │   │   └── Results.jsx      # Full analysis report
│   │   └── components/
│   │       ├── Nav.jsx
│   │       └── PageTransition.jsx
│   └── vite.config.js
├── .env.example
└── README.md
```

---

## How the agents work

Each agent receives the full transcript and returns structured JSON with a score, summary, strengths, weaknesses, and timestamped moments.

```python
# All three run simultaneously
technical_result, comm_result, conf_result = await asyncio.gather(
    analyze_technical(transcript, interview_type),
    analyze_communication(transcript),
    analyze_confidence(transcript),
)

# Synthesizer combines everything
final_report = await synthesize(technical_result, comm_result, conf_result)
```

The overall score is a weighted average: `technical × 0.4 + communication × 0.35 + confidence × 0.25`

---

## Demo

**Live practice flow:**
1. Select interview type → Begin Interview
2. Answer AI-generated questions while recording
3. Click Finish & Analyze → watch 4 agents process in real time
4. Get your full report with timestamped feedback

**Upload flow:**
1. Record your Zoom/Teams interview
2. Upload the file → select interview type
3. Full analysis in ~60 seconds

---

## Built for

Gen AI Capstone Project — demonstrating multi-agent AI system design with real-world applicability in the career development space.

---

## License

MIT
