# Interview Copilot AI — Presentation Script
**Total time: 7 minutes | Mair Ahmed | Gen AI Capstone**

---

## SETUP CHECKLIST (do this before walking up)
- [ ] Backend running: `cd backend && python -m uvicorn main:app --reload --port 8000`
- [ ] Frontend running: `cd frontend && npm run dev` → open http://localhost:5173
- [ ] Browser open at http://localhost:5173, fullscreen, DevTools closed
- [ ] Mic working
- [ ] Name set to "Mair Ahmed", role to "Data Scientist", date to May 10 on the landing page
- [ ] **Fallback:** If backend crashes, navigate to `/results` — it loads from localStorage and still looks great

---

## 1. HOOK — THE PROBLEM (30 seconds)

*Stand, make eye contact, then turn to the screen.*

> "Every year, millions of people go through job interviews and get rejected.
> And every single one of them gets back the exact same thing from the company —
> a rejection email. No feedback. No reason. Nothing.
>
> You have no idea if it was your technical answers, the way you communicated,
> or the fact that you said 'I think' and 'um' forty times.
>
> That's the problem. And that's what Interview Copilot solves."

---

## 2. THE SOLUTION — LANDING PAGE (30 seconds)

*Show the landing page. Point to the four agent icons.*

> "Interview Copilot is a multi-agent AI system that sits in on your mock interview,
> analyzes every answer across three dimensions, and tells you exactly what went wrong —
> and what to fix before the real thing.
>
> The system uses four specialized Claude agents — not one generic chatbot.
> Each has a specific job:
> the **Technical agent** checks depth and accuracy,
> the **Communication agent** evaluates structure and clarity,
> the **Confidence agent** scans for hedging language and filler words,
> and the **Synthesizer** combines everything into a ranked action plan.
>
> I'll type in my name, my target role, and my interview date."

*Type name, role (Data Scientist), pick a date. Click Start.*

---

## 3. THE DASHBOARD (45 seconds)

*Dashboard loads. Point to the countdown banner first.*

> "This is the dashboard. Notice the countdown banner at the top —
> it pulled my interview date from the landing page and it's telling me
> I have 13 days to prepare. One click takes me straight into practice mode.
>
> Below that are my past sessions — scores, trends, what my weakest area is.
> The chart shows my trajectory across sessions. I can toggle between overall,
> technical, communication, and confidence.
>
> And here — the Gmail button."

*Click Sync Gmail. Show the popup opening.*

> "This is one of my favorite features. I can connect my Google account
> and the system scans my inbox using the Gmail API, sends the emails
> to Claude, and automatically extracts any upcoming interviews —
> company, role, date, time, interviewer name — all pulled from natural language email text.
> No forms to fill. It just reads your inbox and finds them."

*If Gmail interviews appear, click one to set countdown. If not, close modal and move on.*

> "Click an interview and the countdown snaps to that date automatically."

---

## 4. LIVE INTERVIEW — RECORDING (1 minute 30 seconds)

*Navigate to Interview page. Select Data Science.*

> "Now let's do a live mock interview. I'll select Data Scientist,
> which is exactly the role I'm targeting.
> The system generates five tailored questions for this interview type."

*Show the questions briefly, then click Begin Interview. Waveform appears.*

> "Notice the live filler word counter in the corner —
> it's listening in real time using the browser's Speech Recognition API,
> no extra API key, no server call. Every filler word ticks up as I speak."

**Answer Q1** — speak naturally with some hedges (30–40 seconds):

> "So, um, the difference between supervised and unsupervised learning is basically —
> I think in supervised learning you have labeled data, so the model learns to predict
> an output from inputs. Like, predicting house prices or classifying emails as spam.
> Unsupervised is where you don't have labels — you're I guess trying to find
> patterns or clusters in the data on your own."

*Point to the live counter ticking up.*

> "Watch — three fillers already. 'Um', 'basically', 'I guess'. In real time."

*Click Next, answer Q2 briefly (20 seconds):*

> "To handle class imbalance I'd probably use oversampling — like SMOTE —
> or I think you can adjust class weights in the model. I'm not totally sure
> which is better in every case but those are my go-to approaches."

*Click Finish & Analyze.*

> "That's it. About 60 seconds of audio. Watch what happens next."

---

## 5. ANALYSIS & RESULTS (2 minutes)

*Loading screen — point to the pipeline steps.*

> "The audio is being transcribed locally by OpenAI Whisper — it runs on my machine,
> the audio never leaves my computer.
> Then the three specialist agents hit the Claude API in parallel — simultaneously,
> not one after another. Total time is roughly the cost of one agent call."

*Results page loads. Score ring animates up.*

> "The score animates in — and notice there's confetti if this beats my last session.
> The ring shows my overall score with the weighted breakdown.
> Technical is 40%, Communication 35%, Confidence 25%."

*Point to the scores section.*

> "Technical: decent. Communication: okay. Confidence: low — and that's accurate.
> I hedged constantly."

*Scroll to timeline.*

> "This is the moment-by-moment timeline. Every flagged moment, timestamped."

*Click a timestamp.*

> "Click any moment and it jumps to that exact second.
> 'I think it's LIFO' — the agent says: you ARE correct,
> but 'I think' sounds like a guess. Say: 'A stack uses LIFO. Period.'
> That's not generic advice. That's a real coaching note on a specific sentence."

*Scroll to filler words.*

> "Filler word breakdown — exact counts. Four 'basically', two 'I think', one 'um'.
> This is what your interviewer was internally logging while you spoke."

*Scroll to action plan.*

> "And finally — the ranked action plan. Five items ordered by impact.
> Number one: eliminate hedging. Number two: lead with the answer, then explain.
> Number three: always state Big-O complexity."

*Click Ask Claude.*

> "Last feature — Ask Claude. I can ask a follow-up question and get streaming,
> personalized coaching grounded in my actual scores."

*Type: 'What should I fix first?' — show the streaming response.*

> "It's not answering generically. It's reading my specific scores and telling me
> exactly where to focus."

---

## 6. ARCHITECTURE — TECHNICAL OVERVIEW (45 seconds)

> "Here's how it's built.
>
> Frontend: React with Tailwind and Framer Motion.
> Backend: FastAPI in Python.
> Transcription: OpenAI Whisper running locally — no extra key needed.
>
> The core of the system is the agent pipeline."

*Draw or point to this:*

```
Audio → Whisper
          ↓
   ┌──────┴──────┐
Technical  Comm  Confidence   ← 3 Claude agents, parallel
   └──────┬──────┘
       Synthesizer
          ↓
     Action Plan + Report
```

> "The key design decision was four agents instead of one.
> One LLM doing everything gives you generic feedback.
> Four specialists each have a narrow focus, a specific evaluation rubric,
> and they run in parallel — so the total analysis time is the time of one agent, not four.
>
> The Gmail integration adds a fifth Claude call — reading your inbox
> and extracting structured interview data from natural language emails."

---

## 7. CLOSING (30 seconds)

> "Most AI projects build chatbots.
>
> This is different. This is a performance intelligence system —
> a closed feedback loop for the highest-stakes conversation most people ever have.
>
> The insight is simple:
> companies know exactly why you didn't get the job.
> They just never tell you.
>
> Interview Copilot tells you.
>
> Thank you."

---

## Q&A CHEAT SHEET

**"How accurate is the feedback?"**
> "The agents are prompted as domain experts with specific rubrics.
> In testing, the feedback matches what an experienced interviewer would say —
> and it's often more specific because it can quote exact moments from the transcript."

**"Why four agents instead of one?"**
> "Specialization. A single prompt trying to evaluate technical depth, communication structure,
> AND confidence simultaneously produces shallow, unfocused feedback.
> Each agent has one job, one rubric, and returns structured JSON.
> The Synthesizer then weighs them. The parallelism is a performance bonus."

**"What interview types does it support?"**
> "Six: Data Science, Software Engineering, Behavioral, Product Management, Leadership, and Finance.
> The Technical agent adjusts its evaluation criteria per type — for Data Science it checks
> for things like model selection reasoning, statistical rigor, and ML best practices."

**"Is the transcription accurate?"**
> "Whisper is state of the art for speech recognition. It handles accents, pacing,
> and crosstalk well. For very short recordings it's near-perfect."

**"Could this be a real product?"**
> "Yes. Freemium: free basic feedback, paid history and coaching.
> The addressable market is anyone who interviews — which is everyone."

**"What was the hardest part to build?"**
> "The Gmail OAuth PKCE flow. Google generates a code verifier when you build the auth URL,
> but the callback creates a new server-side object that doesn't have it.
> Had to store the original flow object in memory keyed by OAuth state
> so the callback could reuse it for the token exchange."

---

## TIMING BREAKDOWN

| Section | Time |
|---|---|
| Hook — the problem | 0:30 |
| Solution — landing page | 0:30 |
| Dashboard + Gmail | 0:45 |
| Live interview recording | 1:30 |
| Analysis + results | 2:00 |
| Architecture | 0:45 |
| Closing | 0:30 |
| **Total** | **~7:00** |
