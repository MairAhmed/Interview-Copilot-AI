import json
import anthropic

SYSTEM = """You are an expert communication coach specializing in interview performance.
You evaluate how clearly and effectively candidates communicate their ideas.
You look for structure, clarity, conciseness, and the use of frameworks like STAR (Situation, Task, Action, Result)."""

PROMPT = """Analyze the following interview transcript from a COMMUNICATION perspective.

Interview Type: {interview_type}

Transcript with timestamps:
{transcript}

Evaluate:
1. Answer structure — did they use STAR or clear frameworks?
2. Clarity — was the answer easy to follow?
3. Conciseness — did they ramble or stay focused?
4. Opening and closing of answers — did they lead with the point?
5. Use of specific examples vs. vague generalities
6. Any moments where they lost the thread or went off-topic

Return ONLY valid JSON matching this exact schema:
{{
  "score": <float 0-10>,
  "summary": "<2-3 sentence overall communication assessment>",
  "strengths": ["<specific communication strength>", ...],
  "weaknesses": ["<specific communication weakness>", ...],
  "moments": [
    {{
      "timestamp": <float seconds>,
      "end_timestamp": <float seconds>,
      "type": "<strength|weakness|tip>",
      "title": "<short title>",
      "description": "<specific feedback — what they said and how to improve it>",
      "agent": "communication"
    }}
  ]
}}

Include 3-6 timeline moments. Reference specific parts of what they said."""

def run(transcript_segments: list, full_text: str, interview_type: str, client: anthropic.Anthropic) -> dict:
    formatted = "\n".join(
        f"[{seg['start']:.1f}s - {seg['end']:.1f}s]: {seg['text']}"
        for seg in transcript_segments
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=SYSTEM,
        messages=[{"role": "user", "content": PROMPT.format(
            interview_type=interview_type,
            transcript=formatted
        )}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
