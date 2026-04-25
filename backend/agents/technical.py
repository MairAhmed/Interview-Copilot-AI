import json
import anthropic

SYSTEM = """You are a senior technical interviewer with 15+ years of experience at top tech companies.
Your job is to critically evaluate a candidate's technical answers.
Be specific, harsh but fair. Reference exact moments from the transcript."""

PROMPT = """Analyze the following interview transcript from a TECHNICAL perspective.

Interview Type: {interview_type}

Transcript with timestamps:
{transcript}

Evaluate:
1. Technical accuracy and correctness
2. Depth of knowledge — did they go beyond surface level?
3. Problem-solving approach
4. Use of concrete examples and specifics
5. Missing concepts they should have mentioned

Return ONLY valid JSON matching this exact schema:
{{
  "score": <float 0-10>,
  "summary": "<2-3 sentence overall technical assessment>",
  "strengths": ["<specific strength>", ...],
  "weaknesses": ["<specific weakness with what was missing>", ...],
  "moments": [
    {{
      "timestamp": <float seconds>,
      "end_timestamp": <float seconds>,
      "type": "<strength|weakness|tip>",
      "title": "<short title>",
      "description": "<specific actionable feedback referencing what they said>",
      "agent": "technical"
    }}
  ]
}}

Include 3-6 timeline moments. Be specific — quote or reference what they actually said."""

def run(transcript_segments: list, full_text: str, interview_type: str, client: anthropic.Anthropic) -> dict:
    formatted = "\n".join(
        f"[{seg['start']:.1f}s - {seg['end']:.1f}s]: {seg['text']}"
        for seg in transcript_segments
    ) or full_text

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
