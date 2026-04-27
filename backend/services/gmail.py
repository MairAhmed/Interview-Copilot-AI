import os
import base64
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
REDIRECT_URI = 'http://localhost:8000/gmail/callback'

# ── Search keywords that signal an interview email ─────────────────────────────
INTERVIEW_QUERY = (
    'subject:(interview OR "phone screen" OR "technical screen" OR '
    '"coding screen" OR "hiring" OR "recruiter" OR "onsite" OR '
    '"virtual interview" OR "video interview" OR "we\'d like to" OR '
    '"schedule" OR "next steps" OR "job offer") newer_than:60d'
)

# Store active flows keyed by OAuth state so the callback can reuse the same
# flow object (which holds the PKCE code_verifier generated during auth_url).
_flow_store: dict[str, Flow] = {}


def get_flow() -> Flow:
    client_config = {
        "web": {
            "client_id":     os.environ["GOOGLE_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
            "redirect_uris": [REDIRECT_URI],
            "auth_uri":  "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    return Flow.from_client_config(client_config, scopes=SCOPES, redirect_uri=REDIRECT_URI)


def create_auth_url() -> str:
    """Create a new flow, build the auth URL, store the flow by state, return the URL."""
    flow = get_flow()
    url, state = flow.authorization_url(prompt='consent', access_type='offline')
    _flow_store[state] = flow
    return url


def pop_flow(state: str) -> Flow | None:
    """Retrieve (and remove) the stored flow for a given OAuth state."""
    return _flow_store.pop(state, None)


def _decode_body(data: str) -> str:
    try:
        padded = data + '=' * (-len(data) % 4)
        return base64.urlsafe_b64decode(padded).decode('utf-8', errors='replace')
    except Exception:
        return ''


def _extract_body(payload: dict) -> str:
    """Recursively pull plain-text body from a Gmail message payload."""
    mime = payload.get('mimeType', '')
    body_data = payload.get('body', {}).get('data', '')

    if mime == 'text/plain' and body_data:
        return _decode_body(body_data)

    for part in payload.get('parts', []):
        result = _extract_body(part)
        if result:
            return result

    return ''


def fetch_interview_emails(credentials) -> list[dict]:
    """Return up to 15 interview-related emails (subject + sender + body snippet)."""
    service = build('gmail', 'v1', credentials=credentials, cache_discovery=False)

    resp = service.users().messages().list(
        userId='me', q=INTERVIEW_QUERY, maxResults=20
    ).execute()

    messages = resp.get('messages', [])
    emails = []

    for msg in messages[:15]:
        try:
            msg_data = service.users().messages().get(
                userId='me', id=msg['id'], format='full'
            ).execute()

            headers = {h['name']: h['value'] for h in msg_data.get('payload', {}).get('headers', [])}
            subject  = headers.get('Subject', '(no subject)')
            sender   = headers.get('From', '')
            date_hdr = headers.get('Date', '')
            body     = _extract_body(msg_data.get('payload', {}))

            # Fall back to snippet if body extraction failed
            if not body.strip():
                body = msg_data.get('snippet', '')

            emails.append({
                'subject': subject,
                'sender':  sender,
                'date':    date_hdr,
                'body':    body[:2000],   # keep token count reasonable
            })
        except Exception:
            continue   # skip malformed messages

    return emails
