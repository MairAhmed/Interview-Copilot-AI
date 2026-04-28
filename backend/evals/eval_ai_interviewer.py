"""
AI Interviewer Evals
=====================
Tests the /ai-interview endpoint across 8 scenarios.
Run after starting the backend: python -m uvicorn main:app --reload --port 8000

Usage:
    cd backend
    python evals/eval_ai_interviewer.py
"""

import urllib.request
import json
import sys

BASE = "http://localhost:8000"
PASS = "\033[92m PASS\033[0m"
FAIL = "\033[91m FAIL\033[0m"
WARN = "\033[93m WARN\033[0m"

results = []

def post(payload, timeout=30):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}/ai-interview", data=data,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode().strip()

def check(name, response, checks):
    passed, failed, warns = [], [], []
    for label, ok, is_warn in checks:
        if ok:
            passed.append(label)
        elif is_warn:
            warns.append(label)
        else:
            failed.append(label)

    status = FAIL if failed else (WARN if warns else PASS)
    print(f"\n{'─'*60}")
    print(f"[{status} ] {name}")
    print(f"  Response: \"{response[:160]}{'...' if len(response)>160 else ''}\"")
    print(f"  Words: {len(response.split())}  |  Questions: {response.count('?')}")
    for label in passed:  print(f"  ✓ {label}")
    for label in warns:   print(f"  ⚠ {label}")
    for label in failed:  print(f"  ✗ {label}")

    results.append((name, not bool(failed)))
    return response

# ── Helper ─────────────────────────────────────────────────────────────────────
def word_count(s):   return len(s.split())
def sentence_count(s): return s.count('.') + s.count('?') + s.count('!')
def has_question(s): return '?' in s
def is_short(s):     return word_count(s) <= 60
def mentions_name(s, name): return name.lower() in s.lower()
def sounds_closing(s):
    kw = ["concludes", "in touch", "that's all", "thank you", "wrap up", "our time"]
    return any(k in s.lower() for k in kw)


print("=" * 60)
print("  Interview Copilot — AI Interviewer Evals")
print("=" * 60)

# ── EVAL 1: Initial greeting ───────────────────────────────────────────────────
try:
    r = post({"messages": [], "interview_type": "data-science", "exchange_count": 0})
    check("EVAL 1 · Initial greeting", r, [
        ("Contains a question",           has_question(r),                   False),
        ("Short enough (≤60 words)",      is_short(r),                       False),
        ("Not empty",                     len(r) > 10,                       False),
        ("Introduces self or says hello", any(w in r.lower() for w in
            ["hello", "hi", "welcome", "alex", "great to", "nice to"]),      True),
    ])
except Exception as e:
    print(f"\n{FAIL} EVAL 1 · Initial greeting — ERROR: {e}")
    results.append(("EVAL 1", False))


# ── EVAL 2: Follow-up after strong answer ─────────────────────────────────────
try:
    messages = [
        {"role": "interviewer", "text": "Tell me about a data science project you're proud of."},
        {"role": "user",        "text": "I built a churn prediction model using XGBoost on 2 million rows. It achieved 91% AUC and reduced customer churn by 18% in the first quarter after deployment."},
    ]
    r = post({"messages": messages, "interview_type": "data-science", "exchange_count": 1})
    check("EVAL 2 · Follow-up after strong answer", r, [
        ("Asks a follow-up question",  has_question(r),  False),
        ("Short (≤60 words)",          is_short(r),      False),
        ("Not generic praise only",    word_count(r) > 5, False),
        ("References the answer",      any(w in r.lower() for w in
            ["churn", "xgboost", "model", "91", "18", "project", "data"]), True),
    ])
except Exception as e:
    print(f"\n{FAIL} EVAL 2 · Follow-up after strong answer — ERROR: {e}")
    results.append(("EVAL 2", False))


# ── EVAL 3: Follow-up after weak/short answer ─────────────────────────────────
try:
    messages = [
        {"role": "interviewer", "text": "How do you handle missing data in a dataset?"},
        {"role": "user",        "text": "I just remove them."},
    ]
    r = post({"messages": messages, "interview_type": "data-science", "exchange_count": 1})
    check("EVAL 3 · Follow-up after weak answer", r, [
        ("Asks a probing follow-up",   has_question(r),  False),
        ("Short (≤60 words)",          is_short(r),      False),
        ("Doesn't give up / stays in character",
                                       not sounds_closing(r), False),
    ])
except Exception as e:
    print(f"\n{FAIL} EVAL 3 · Follow-up after weak answer — ERROR: {e}")
    results.append(("EVAL 3", False))


# ── EVAL 4: Response length consistency ───────────────────────────────────────
try:
    messages = [
        {"role": "interviewer", "text": "Walk me through your approach to feature engineering."},
        {"role": "user",        "text": "I start by understanding the business problem, then look at correlations and domain knowledge to create meaningful features. I use techniques like polynomial features, interaction terms, and target encoding for categorical variables."},
    ]
    r = post({"messages": messages, "interview_type": "data-science", "exchange_count": 2})
    wc = word_count(r)
    check("EVAL 4 · Response length (should be ≤60 words)", r, [
        ("Word count ≤ 60",   wc <= 60,  False),
        ("Word count ≤ 80",   wc <= 80,  True),
        ("Not too short (>5)", wc > 5,   False),
        ("Has a question",    has_question(r), False),
    ])
except Exception as e:
    print(f"\n{FAIL} EVAL 4 · Response length — ERROR: {e}")
    results.append(("EVAL 4", False))


# ── EVAL 5: Stays in character (no coaching/feedback) ─────────────────────────
try:
    messages = [
        {"role": "interviewer", "text": "Can you explain overfitting?"},
        {"role": "user",        "text": "Overfitting is when a model learns the training data too well including noise, so it performs badly on new data."},
    ]
    r = post({"messages": messages, "interview_type": "data-science", "exchange_count": 2})
    bad_phrases = ["score", "well done", "great answer", "you should", "tip:", "feedback",
                   "improve", "7 out of", "8 out of", "out of 10"]
    check("EVAL 5 · Stays in character (no coaching)", r, [
        ("No score/feedback language",
            not any(p in r.lower() for p in bad_phrases), False),
        ("Still asks a question",  has_question(r),  False),
        ("Short (≤60 words)",      is_short(r),      False),
    ])
except Exception as e:
    print(f"\n{FAIL} EVAL 5 · Stays in character — ERROR: {e}")
    results.append(("EVAL 5", False))


# ── EVAL 6: Behavioral interview type ─────────────────────────────────────────
try:
    r = post({"messages": [], "interview_type": "behavioral", "exchange_count": 0})
    check("EVAL 6 · Behavioral type — correct framing", r, [
        ("Asks a question",    has_question(r),  False),
        ("Short (≤60 words)",  is_short(r),      False),
        ("Behavioral framing", any(w in r.lower() for w in
            ["tell me about", "describe", "time when", "example", "situation",
             "experience", "walk me through"]), True),
    ])
except Exception as e:
    print(f"\n{FAIL} EVAL 6 · Behavioral type — ERROR: {e}")
    results.append(("EVAL 6", False))


# ── EVAL 7: Closing after 5 exchanges ─────────────────────────────────────────
try:
    messages = [
        {"role": "interviewer", "text": "Tell me about yourself."},
        {"role": "user",        "text": "I'm a data scientist with 3 years of experience in ML."},
        {"role": "interviewer", "text": "What's your strongest technical skill?"},
        {"role": "user",        "text": "Python and scikit-learn, particularly for classification problems."},
        {"role": "interviewer", "text": "Describe a time you dealt with messy data."},
        {"role": "user",        "text": "I once had a dataset with 40% missing values. I used iterative imputation and domain knowledge to fill gaps."},
        {"role": "interviewer", "text": "How do you communicate results to non-technical stakeholders?"},
        {"role": "user",        "text": "I use visualizations and focus on business impact rather than model metrics."},
        {"role": "interviewer", "text": "Where do you see yourself in 5 years?"},
        {"role": "user",        "text": "Leading a data science team and driving strategic decisions."},
    ]
    r = post({"messages": messages, "interview_type": "data-science", "exchange_count": 5})
    check("EVAL 7 · Closing after max exchanges", r, [
        ("Contains a closing phrase",  sounds_closing(r),  False),
        ("Short (≤60 words)",          is_short(r),        False),
        ("Sounds like an ending",      not has_question(r) or sounds_closing(r), True),
    ])
except Exception as e:
    print(f"\n{FAIL} EVAL 7 · Closing — ERROR: {e}")
    results.append(("EVAL 7", False))


# ── EVAL 8: Does not break on very short user input ───────────────────────────
try:
    messages = [
        {"role": "interviewer", "text": "What is precision and recall?"},
        {"role": "user",        "text": "I don't know."},
    ]
    r = post({"messages": messages, "interview_type": "data-science", "exchange_count": 1})
    check("EVAL 8 · Graceful handling of 'I don't know'", r, [
        ("Returns a response",    len(r) > 5,      False),
        ("Asks a follow-up",      has_question(r), False),
        ("Short (≤60 words)",     is_short(r),     False),
        ("Doesn't crash",         True,            False),
    ])
except Exception as e:
    print(f"\n{FAIL} EVAL 8 · Graceful handling — ERROR: {e}")
    results.append(("EVAL 8", False))


# ── Summary ────────────────────────────────────────────────────────────────────
passed_count = sum(1 for _, ok in results if ok)
total = len(results)
print(f"\n{'='*60}")
print(f"  RESULTS: {passed_count}/{total} evals passed")
print(f"{'='*60}")
for name, ok in results:
    icon = "✓" if ok else "✗"
    print(f"  {icon}  {name}")

if passed_count == total:
    print("\n  All evals passed. AI Interviewer is working correctly.")
elif passed_count >= total * 0.75:
    print("\n  Most evals passed. Review warnings above.")
else:
    print("\n  Several evals failed. Check the responses above.")

sys.exit(0 if passed_count == total else 1)
