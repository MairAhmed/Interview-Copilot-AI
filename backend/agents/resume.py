import json
import anthropic

SYSTEM = """You are a senior technical interviewer with 15+ years of experience at top tech companies.
Given a candidate's resume, you craft highly targeted interview questions that go beyond surface-level.
You probe the depth behind claimed skills, look for gaps, and tailor every question to that specific person."""

PROMPT = """Review this candidate's resume and generate targeted interview questions with ideal answers.

Interview Type: {interview_type}

Resume / CV:
{resume_text}

Generate exactly 5 interview questions that are:
1. Directly tailored to THIS candidate's specific projects, roles, and claimed skills
2. Probing — not "tell me about X" but "in project X you mention Y, walk me through how you handled Z"
3. Covering any gaps or suspiciously vague claims on their resume
4. Appropriate in difficulty for the interview type
5. Mix of technical depth, past behaviour, and situational judgment

For each question also write an ideal answer — what a strong candidate should say.
The ideal answer should:
- Be 3-5 sentences, concise and direct
- Lead with the bottom line (BLUF), then support it
- Include specific details, numbers, or techniques where relevant
- Avoid hedging language ("I think", "maybe", "I guess")
- Sound like a confident, well-prepared candidate

Also infer:
- Their likely target role (1 short phrase)
- Their 3 strongest relevant skills

Return ONLY valid JSON:
{{
  "questions": [
    "<tailored question 1>",
    "<tailored question 2>",
    "<tailored question 3>",
    "<tailored question 4>",
    "<tailored question 5>"
  ],
  "ideal_answers": [
    "<ideal answer to question 1>",
    "<ideal answer to question 2>",
    "<ideal answer to question 3>",
    "<ideal answer to question 4>",
    "<ideal answer to question 5>"
  ],
  "role": "<inferred target role, e.g. 'Senior Data Scientist'>",
  "key_skills": ["<skill 1>", "<skill 2>", "<skill 3>"]
}}"""


def run(resume_text: str, interview_type: str, client: anthropic.Anthropic) -> dict:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=SYSTEM,
        messages=[{"role": "user", "content": PROMPT.format(
            interview_type=interview_type,
            resume_text=resume_text[:6000],   # cap to ~1500 words
        )}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
