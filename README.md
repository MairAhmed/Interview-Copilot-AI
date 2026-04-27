# Interview Copilot AI

> **Know exactly why you didn't get the job.**

Most candidates leave interviews not knowing why they failed. Interview Copilot records, transcribes, and runs four specialized AI agents on your performance — giving you the exact feedback interviewers never share.

---

## What it does

Upload a recording from Zoom or Teams, practice live, or capture a live meeting — then get a full breakdown across three dimensions:

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

**Four Claude agents run concurrently** via `asyncio.gather()` — Technical, Communication, and Confidence analyze simultaneously, then the Synthesizer combines all three into a ranked action plan. Full analysis in under 60 seconds.

---

## Features

### Core
- **Three recording modes** — Live practice with AI questions, upload any Zoom/Teams/phone recording, or capture a live meeting with system audio
- **Multi-agent pipeline** — 4 specialized Claude agents analyze your performance in parallel
- **Moment-by-moment timeline** — every flagged moment timestamped and clickable
- **Filler word detection** — exact counts of "um", "I think", "I guess", "basically", and more
- **Works with any interview type** — SWE, behavioral, PM, data science, finance, leadership

### Dashboard
- **Session history** — track improvement across sessions with interactive trend charts
- **Improvement deltas** — see exactly how much each score moved from last session
- **Interview countdown** — days-until-interview banner with one-click practice shortcut
- **Gmail sync** — connect your Google account to auto-detect upcoming interviews from your inbox

### Results & Coaching
- **Animated score reveal** — scores count up from 0 with cubic easing on load
- **Confetti on improvement** — celebrates when your score beats your last session
- **Ask Claude** — streaming follow-up coaching chat grounded in your actual results
- **Resume-based questions** — upload your resume (PDF or text) to get 5 tailored interview questions

### Polish
- **Live filler counter** — real-time filler word badge during recording using Web Speech API
- **Toast notifications** — non-blocking success/error feedback throughout the app
- **Error boundary** — graceful crash recovery so one broken component never kills the whole app
- **Fully local transcription** — Whisper runs on your machine, audio never leaves your computer

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Python 3.12+ |
| AI | Claude claude-sonnet-4-6 (4 agents + email parser + coaching) via Anthropic SDK |
| Transcription | OpenAI Whisper (runs locally, no API key needed) |
| Audio capture | Web MediaRecorder API + getDisplayMedia for system audio |
| Speech (live) | Web Speech API (browser-native, no key needed) |
| Gmail | Google OAuth 2.0 + Gmail API (optional) |

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- [ffmpeg](https://ffmpeg.org/) installed and on PATH
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

### 1. Clone the repo

```bash
git clone https://github.com/MairAhmed/Interview-Copilot-AI.git
cd Interview-Copilot-AI
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...

# Optional — only needed for Gmail sync feature
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
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

## Gmail Setup (optional)

The Gmail sync feature lets you connect your Google account so the app can automatically detect upcoming interviews from your inbox and set the countdown banner.

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a project
2. Enable the **Gmail API**
3. Configure the **OAuth consent screen** (External, add your Gmail as a test user)
4. Create an **OAuth 2.0 Client ID** (Web application)
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:8000/gmail/callback`
5. Copy the Client ID and Secret into your `.env` file

---

## Project Structure

```
Interview-Copilot-AI/
├── backend/
│   ├── main.py                  # FastAPI app — all endpoints
│   ├── models.py                # Pydantic response models
│   ├── requirements.txt
│   ├── agents/
│   │   ├── technical.py         # Technical depth agent
│   │   ├── communication.py     # Communication structure agent
│   │   ├── confidence.py        # Confidence & filler word agent
│   │   ├── synthesizer.py       # Combines agents → action plan
│   │   ├── resume.py            # Resume → tailored questions
│   │   └── email_parser.py      # Gmail → structured interview data
│   └── services/
│       ├── transcription.py     # Whisper audio transcription
│       └── gmail.py             # Google OAuth + Gmail API
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Onboarding — name, role, date
│   │   │   ├── Dashboard.jsx    # Session history, trends, Gmail sync
│   │   │   ├── Interview.jsx    # Recording + live filler counter
│   │   │   └── Results.jsx      # Full report, Ask Claude, confetti
│   │   ├── components/
│   │   │   ├── Nav.jsx
│   │   │   ├── PageTransition.jsx
│   │   │   ├── Toast.jsx        # Toast notification system
│   │   │   └── ErrorBoundary.jsx
│   │   └── utils/
│   │       └── sessions.js      # localStorage session helpers
│   └── vite.config.js
├── .env
└── README.md
```

---

## How the agents work

Each agent receives the full transcript and returns structured JSON with a score, summary, strengths, weaknesses, and timestamped moments.

```python
# Three specialist agents run simultaneously
tech_result, comm_result, (conf_result, filler_counts) = await asyncio.gather(
    loop.run_in_executor(executor, run_technical),
    loop.run_in_executor(executor, run_communication),
    loop.run_in_executor(executor, run_confidence),
)

# Synthesizer combines everything into a ranked action plan
synth_result = await loop.run_in_executor(executor, run_synthesizer)
```

The overall score is a weighted average:
```
overall = technical × 0.4 + communication × 0.35 + confidence × 0.25
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze` | Full audio analysis — transcribe + 4 agents |
| `POST` | `/generate-questions` | Resume → 5 tailored interview questions |
| `POST` | `/ask` | Streaming coaching follow-up (SSE) |
| `GET` | `/gmail/auth-url` | Start Gmail OAuth flow |
| `GET` | `/gmail/callback` | OAuth callback — fetch + parse emails |
| `GET` | `/gmail/status` | Check if Gmail credentials are configured |
| `POST` | `/transcribe-only` | Transcribe audio without analysis |
| `GET` | `/health` | Health check |

---

## Built for

Gen AI Capstone Project — demonstrating multi-agent AI system design with real-world applicability in the career development space.

---

## License

MIT
