"""
Email Parser Agent
──────────────────
Receives a list of raw email dicts (subject, sender, date, body) and asks
Claude to extract structured interview details from them.

Returns: list of interview dicts, e.g.
  [{"company": "Google", "role": "SWE", "date": "2026-04-30",
    "time": "2:00 PM EST", "type": "Technical Screen", "interviewer": "Jane"}]
"""

import json
import re
import anthropic


def run(emails: list[dict], client: anthropic.Anthropic) -> list[dict]:
    if not emails:
        return []

    # Build a compact representation for the prompt
    email_blocks = []
    for i, e in enumerate(emails, 1):
        block = (
            f"--- EMAIL {i} ---\n"
            f"From: {e['sender']}\n"
            f"Date: {e['date']}\n"
            f"Subject: {e['subject']}\n"
            f"Body:\n{e['body'][:1200]}"
        )
        email_blocks.append(block)

    email_text = "\n\n".join(email_blocks)

    prompt = f"""You are an assistant that extracts upcoming job interview details from emails.

EMAILS:
{email_text}

Task: find every upcoming interview mentioned and return a JSON array.
Each item must have these fields (use null if unknown):
  - company      : string  — company / organization name
  - role         : string  — job title or role being interviewed for
  - date         : string  — date in YYYY-MM-DD format (REQUIRED — skip if no date found)
  - time         : string  — time + timezone, e.g. "2:00 PM EST"
  - type         : string  — e.g. "Phone Screen", "Technical Interview", "Onsite", "Video Call", "HR Round"
  - interviewer  : string  — interviewer or recruiter name if mentioned

Rules:
- Only include interviews that have a specific date. Skip vague references.
- If the same interview appears in multiple emails, include it once.
- Dates must be in the future relative to today.
- Return ONLY valid JSON array — no markdown, no explanation.
- If nothing qualifies, return: []"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()

    # Robustly extract the JSON array even if Claude wraps it in markdown
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if not match:
        return []

    try:
        results = json.loads(match.group())
        # Keep only entries that have a date
        return [r for r in results if isinstance(r, dict) and r.get('date')]
    except json.JSONDecodeError:
        return []
