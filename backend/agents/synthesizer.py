import json
import anthropic

SYSTEM = """You are a senior career coach who synthesizes multi-dimensional interview feedback into a clear, prioritized improvement plan.
You are empathetic but direct. Your job is to tell candidates exactly what to work on to get the job next time."""

PROMPT = """You have received analysis from three specialized agents on an interview performance.

Interview Type: {interview_type}

TECHNICAL AGENT FINDINGS:
Score: {tech_score}/10
Summary: {tech_summary}
Key weaknesses: {tech_weaknesses}

COMMUNICATION AGENT FINDINGS:
Score: {comm_score}/10
Summary: {comm_summary}
Key weaknesses: {comm_weaknesses}

CONFIDENCE AGENT FINDINGS:
Score: {conf_score}/10
Summary: {conf_summary}
Key weaknesses: {conf_weaknesses}

Filler words: {filler_summary}

Full transcript for context:
{transcript}

Based on ALL of this, create:
1. A 2-3 sentence overall performance summary (honest, not sugar-coated)
2. A prioritized action plan — the TOP 5 things they must work on, ordered by impact

Return ONLY valid JSON:
{{
  "overall_summary": "<honest 2-3 sentence summary of the full performance>",
  "action_plan": [
    "<#1 highest impact thing to work on — be specific>",
    "<#2>",
    "<#3>",
    "<#4>",
    "<#5>"
  ]
}}"""

def run(
    tech_result: dict,
    comm_result: dict,
    conf_result: dict,
    filler_counts: list,
    full_text: str,
    interview_type: str,
    client: anthropic.Anthropic
) -> dict:
    filler_summary = ", ".join(f'"{f["word"]}" x{f["count"]}' for f in filler_counts[:5]) or "none"

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=SYSTEM,
        messages=[{"role": "user", "content": PROMPT.format(
            interview_type=interview_type,
            tech_score=tech_result["score"],
            tech_summary=tech_result["summary"],
            tech_weaknesses="; ".join(tech_result.get("weaknesses", [])[:3]),
            comm_score=comm_result["score"],
            comm_summary=comm_result["summary"],
            comm_weaknesses="; ".join(comm_result.get("weaknesses", [])[:3]),
            conf_score=conf_result["score"],
            conf_summary=conf_result["summary"],
            conf_weaknesses="; ".join(conf_result.get("weaknesses", [])[:3]),
            filler_summary=filler_summary,
            transcript=full_text[:2000]
        )}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
