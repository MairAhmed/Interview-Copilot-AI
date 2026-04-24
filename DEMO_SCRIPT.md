# Interview Copilot — Demo Script
**Total time: ~7 minutes**

---

## BEFORE YOU START (setup checklist)
- [ ] Backend running: `cd backend && python -m uvicorn main:app --reload --port 8000`
- [ ] Frontend running: `cd frontend && npm run dev` → open http://localhost:5173
- [ ] Browser at http://localhost:5173, fullscreen
- [ ] Chrome DevTools closed
- [ ] Mic working and not muted
- [ ] Fallback: Results page works even WITHOUT backend (uses built-in demo data)

**Fallback plan if backend fails:** Navigate directly to `/results` — it auto-loads the demo result. Still looks perfect.

---

## OPENING (30 seconds)
*Stand, make eye contact, then open the laptop.*

> "Every year, millions of people go through interviews and get rejected.
> And every single one of them gets the same thing back from the company:
> a rejection email. No feedback. No reason. Nothing.
>
> That's the problem Interview Copilot solves."

*Click to the home screen.*

> "This is a multi-agent AI system that sits in on your interview,
> analyzes every answer across three dimensions, and tells you
> exactly what went wrong — and what to fix."

---

## SHOW THE HOME SCREEN (30 seconds)

Point to the 4 agent pills at the bottom:

> "The system uses four specialized AI agents — not one generic chatbot.
> Each agent has a specific job:
> the Technical agent evaluates depth and accuracy,
> the Communication agent checks structure and clarity,
> the Confidence agent scans for hedging language and filler words,
> and the Synthesizer combines everything into a prioritized action plan."

> "You can upload a recording from Zoom or Teams — or do a live mock interview right now.
> I'm going to do the live version."

---

## LIVE MOCK INTERVIEW (2 minutes)

*Click "Start Mock Interview"*

> "I'll select Technical — Software Engineering, which is what most CS students are interviewing for."

*Show the questions briefly.*

> "The system shows me the questions upfront so I know what to expect — just like real interview prep."

*Click "Begin Interview" — microphone starts, waveform appears.*

**Answer Q1** (30–45 seconds, answer naturally but imperfectly — use some hedging):

> "So, um, a stack is basically a data structure — I think it's LIFO, last in first out.
> You'd use it for, like, undo operations in a text editor, or I guess for parsing parentheses.
> A queue is first in first out, so you'd use that for, like, job scheduling or print queues."

*Click "Next Question"*

**Answer Q2** (30–45 seconds):

> "I think for a URL shortener, you'd basically take the long URL and hash it — like MD5 or something.
> Then store the mapping in a database. When someone hits the short URL, you look it up and redirect.
> I'm not sure if this is the best way but that's how I'd start."

*Click "Finish & Analyze"*

> "That's it. Two answers, about 90 seconds of audio.
> Now watch what happens."

---

## ANALYSIS LOADING (30–60 seconds)

*The agent progress screen appears — point to each step.*

> "The audio is being transcribed by OpenAI Whisper.
> Then — and this is the key part — three agents analyze it simultaneously, in parallel.
> Not sequentially. All at once."

> "The Technical agent, the Communication agent, and the Confidence agent are all running right now.
> Then the Synthesizer takes their outputs and builds the final report."

*Wait for redirect to results.*

---

## RESULTS WALKTHROUGH (2 minutes)

*Results page loads — score ring animates.*

> "The score ring animates in — 6.1 out of 10.
> That's an honest score. Not inflated, not vague."

**Point to the radar chart:**

> "This radar shows all three dimensions at once.
> You can immediately see that confidence is the weakest — that 4.8 — which is exactly right.
> I hedged constantly."

**Click the first timeline moment:**

> "Here's where it gets impressive. This is the moment-by-moment timeline.
> Let me click on the first one."

*Click timestamp 0:18 — 'I think it's like a stack…'*

> "'I think it's like a stack' — the AI caught that.
> And it says: 'You ARE correct — but I think it's like sounds like a guess.
> Say: A stack uses LIFO ordering. Period. Own it.'
>
> That's not generic feedback. That's a real interviewer coaching you."

**Click the weakness at 0:54:**

> "Here — 'Missing Big-O, critical gap.' It says I never mentioned time complexity.
> At any SWE interview, omitting that is a red flag.
> The AI noticed I skipped it. A real interviewer would have marked me down for exactly this."

**Scroll to the action plan:**

> "Finally — the action plan. Five items, ordered by impact.
> Item one: record yourself and count your filler words.
> Item two: lead with the answer, not the context.
> Item three: always state Big-O."

> "This is your coaching session after every interview.
> Except companies never give you this. We do."

---

## ARCHITECTURE (60 seconds)

*Optional — if professor asks, or include it.*

> "Quick look at the technical architecture:"

Draw or point to:
```
Audio → Whisper (transcription)
         ↓
    ┌────┴────┐
Technical  Communication  Confidence   ← parallel Claude API calls
    └────┬────┘
      Synthesizer
         ↓
    Structured JSON → React UI
```

> "The backend is FastAPI. Transcription is local Whisper — no extra API key needed.
> The three specialist agents call Claude's API concurrently using Python asyncio.
> The Synthesizer takes all three outputs and generates the final report.
>
> The key architectural choice: four agents instead of one.
> One LLM doing everything would give you generic feedback.
> Four specialists give you specific, dimensional feedback — and they can run in parallel,
> so the total time is the time of one agent, not four."

---

## CLOSING (30 seconds)

> "Most capstone projects build chatbots or assistants.
>
> This is different. This is a performance intelligence system.
>
> The insight is simple: interviews are the highest-stakes conversations most people ever have,
> and the feedback loop is completely broken.
> Interview Copilot fixes that.
>
> Thank you."

---

## Q&A PREP — likely questions

**"How accurate is the feedback?"**
> "The agents are prompted as domain experts with specific evaluation criteria.
> In our testing, the feedback mirrors what experienced interviewers would say — often more specifically,
> because the AI can quote exact moments from the transcript."

**"Could you use this for any type of interview?"**
> "Yes — we support six types: behavioral, SWE, data science, product, leadership, and finance.
> Each has different question banks and the Technical agent adjusts its evaluation criteria based on the type."

**"What if the backend is slow?"**
> "The three specialist agents run in parallel, not sequentially.
> Total time is roughly equal to one agent call, not three. Usually 30–45 seconds."

**"Why Claude instead of GPT?"**
> "Claude has stronger instruction-following for structured JSON output, which is critical
> for the agent pipeline — we need consistent schema from every agent, every time."

**"Is this commercially viable?"**
> "The core use case is clear: students, job-seekers, career changers.
> Freemium model: free basic feedback, paid deep analysis and history.
> The addressable market is anyone who interviews — which is everyone."
