import json
import re
import anthropic

SYSTEM = """You are a behavioral psychologist and executive coach who specializes in interview confidence and presence.
You analyze language patterns that signal confidence vs. uncertainty.
You are direct and honest — you call out exactly what undermined the candidate's credibility."""

PROMPT = """Analyze the following interview transcript for CONFIDENCE and PRESENCE.

Interview Type: {interview_type}

Transcript with timestamps:
{transcript}

Filler word counts detected: {filler_summary}

Evaluate:
1. Hedging language ("I think", "I guess", "maybe", "sort of", "kind of", "I believe", "I'm not sure but")
2. Assertiveness — did they own their answers or constantly qualify?
3. Self-deprecating language ("I'm not an expert but...", "This might be wrong but...")
4. Moments of strong conviction vs. moments of visible uncertainty
5. Pace and completeness of answers (did they trail off? cut themselves short?)

Return ONLY valid JSON matching this exact schema:
{{
  "score": <float 0-10>,
  "summary": "<2-3 sentence overall confidence assessment>",
  "strengths": ["<specific confidence strength>", ...],
  "weaknesses": ["<specific confidence weakness — quote the exact hedging language>", ...],
  "moments": [
    {{
      "timestamp": <float seconds>,
      "end_timestamp": <float seconds>,
      "type": "<strength|weakness|tip>",
      "title": "<short title>",
      "description": "<specific feedback — quote what they said and give stronger alternative>",
      "agent": "confidence"
    }}
  ]
}}

Include 3-6 timeline moments. Quote exact phrases that show confidence or lack thereof."""

FILLER_WORDS = [
    "um", "uh", "like", "you know", "sort of", "kind of",
    "i think", "i guess", "i mean", "basically", "literally",
    "actually", "so", "right", "okay"
]

def count_fillers(text: str) -> list[dict]:
    text_lower = text.lower()
    counts = []
    for word in FILLER_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        count = len(re.findall(pattern, text_lower))
        if count > 0:
            counts.append({"word": word, "count": count})
    return sorted(counts, key=lambda x: x["count"], reverse=True)

def run(transcript_segments: list, full_text: str, interview_type: str, client: anthropic.Anthropic) -> tuple[dict, list]:
    filler_counts = count_fillers(full_text)
    filler_summary = ", ".join(f'"{f["word"]}" x{f["count"]}' for f in filler_counts[:8]) or "none detected"

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
            transcript=formatted,
            filler_summary=filler_summary
        )}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip()), filler_counts
