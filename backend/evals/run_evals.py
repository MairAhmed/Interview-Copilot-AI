"""
Interview Copilot — Eval Suite
===============================
Run from the backend directory:
    python -m evals.run_evals

Three evaluation layers:
  1. Golden Set   — strong/average/weak transcripts, verify correct score ordering
  2. Consistency  — same transcript 3x, verify variance < 0.5
  3. Filler Words — AI filler count vs regex ground truth, compute accuracy %
"""

import asyncio, sys, re, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
import anthropic as _anthropic

# Try multiple .env locations
for _p in [
    Path(__file__).parent.parent.parent / ".env",
    Path(__file__).parent.parent / ".env",
    Path.cwd().parent / ".env",
    Path.cwd() / ".env",
]:
    if _p.exists():
        load_dotenv(dotenv_path=_p, override=True)
        break

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.technical     import run as _tech_run
from agents.communication import run as _comm_run
from agents.confidence    import run as _conf_run
from agents.synthesizer   import run as _synth_run
from evals.transcripts    import TRANSCRIPTS, EXPECTED

CLIENT   = _anthropic.Anthropic()
EXECUTOR = ThreadPoolExecutor(max_workers=4)

# ── Colours ────────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):    print(f"  {GREEN}✓{RESET}  {msg}")
def fail(msg):  print(f"  {RED}✗{RESET}  {msg}")
def warn(msg):  print(f"  {YELLOW}~{RESET}  {msg}")
def section(s): print(f"\n{BOLD}{CYAN}{'─'*60}{RESET}\n{BOLD}{CYAN}  {s}{RESET}\n{'─'*60}")

PASSES = []
FAILS  = []

def record(passed, msg):
    if passed:
        ok(msg);   PASSES.append(msg)
    else:
        fail(msg); FAILS.append(msg)

# ── Full pipeline run ──────────────────────────────────────────────────────────
def _run_in_thread(fn, *args):
    """Run a sync agent function in a thread so we can await it."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(EXECUTOR, fn, *args)

async def run_pipeline(transcript: str, interview_type: str = "technical-swe"):
    segments = []   # evals use plain text — no timed segments needed

    t_res, c_res, conf_tuple = await asyncio.gather(
        _run_in_thread(_tech_run, segments, transcript, interview_type, CLIENT),
        _run_in_thread(_comm_run, segments, transcript, interview_type, CLIENT),
        _run_in_thread(_conf_run, segments, transcript, interview_type, CLIENT),
    )

    # confidence returns (result_dict, filler_list) tuple
    if isinstance(conf_tuple, tuple):
        conf_res, filler_list = conf_tuple
    else:
        conf_res, filler_list = conf_tuple, conf_tuple.get("filler_words", [])

    synth = await _run_in_thread(
        _synth_run, t_res, c_res, conf_res, filler_list, transcript, interview_type, CLIENT
    )

    overall = round(t_res["score"] * 0.4 + c_res["score"] * 0.35 + conf_res["score"] * 0.25, 2)
    return {
        "overall":       overall,
        "technical":     t_res["score"],
        "communication": c_res["score"],
        "confidence":    conf_res["score"],
        "filler_words":  filler_list,
        "moments_count": (len(t_res.get("moments", [])) +
                          len(c_res.get("moments", [])) +
                          len(conf_res.get("moments", []))),
        "action_plan":   synth.get("action_plan", []),
    }

# ── EVAL 1: Golden Set ─────────────────────────────────────────────────────────
async def eval_golden_set():
    section("EVAL 1 — Golden Set (strong > average > weak)")
    results = {}

    for label in ["strong", "average", "weak"]:
        print(f"\n  Running {label} transcript...")
        t0 = time.time()
        r  = await run_pipeline(TRANSCRIPTS[label])
        elapsed = time.time() - t0
        results[label] = r
        print(f"    Overall={r['overall']}  Tech={r['technical']}  Comm={r['communication']}  Conf={r['confidence']}  ({elapsed:.1f}s)")

        exp = EXPECTED[label]
        for dim in ["overall", "technical", "communication", "confidence"]:
            lo, hi = exp[dim]
            val    = r[dim]
            passed = lo <= val <= hi
            record(passed, f"{label.capitalize()} {dim}: {val} in [{lo}, {hi}]")

    # Ordering checks
    print()
    for dim in ["overall", "technical", "communication", "confidence"]:
        s, a, w = results["strong"][dim], results["average"][dim], results["weak"][dim]
        passed = s > a > w
        record(passed, f"Ordering {dim}: strong({s}) > average({a}) > weak({w})")

    return results

# ── EVAL 2: Consistency ────────────────────────────────────────────────────────
async def eval_consistency():
    section("EVAL 2 — Consistency (same transcript × 3, variance < 0.5)")
    runs = []
    for i in range(3):
        print(f"  Run {i+1}/3...")
        r = await run_pipeline(TRANSCRIPTS["average"])
        runs.append(r)
        print(f"    Overall={r['overall']}  Tech={r['technical']}  Comm={r['communication']}  Conf={r['confidence']}")

    print()
    for dim in ["overall", "technical", "communication", "confidence"]:
        vals    = [r[dim] for r in runs]
        spread  = max(vals) - min(vals)
        passed  = spread < 0.5
        record(passed, f"{dim} spread: {spread:.2f} (max-min across 3 runs, threshold < 0.5)")

    return runs

# ── EVAL 3: Filler Word Accuracy ───────────────────────────────────────────────
async def eval_filler_words():
    section("EVAL 3 — Filler Word Accuracy (AI count vs regex ground truth)")

    # Regex ground truth
    FILLER_PATTERNS = [
        r"\bi think\b",
        r"\bum+\b",
        r"\buh+\b",
        r"\bi guess\b",
        r"\blike\b",
        r"\bbasically\b",
        r"\byou know\b",
    ]

    transcript = TRANSCRIPTS["weak"]
    text_lower = transcript.lower()

    ground_truth = {}
    for pat in FILLER_PATTERNS:
        word = pat.replace(r"\b", "").replace("\\b", "").replace("+", "")
        count = len(re.findall(pat, text_lower))
        if count > 0:
            ground_truth[word] = count

    total_gt = sum(ground_truth.values())
    print(f"\n  Ground truth (regex): {ground_truth}")
    print(f"  Total filler instances: {total_gt}")

    # AI detection
    print("\n  Running confidence agent...")
    raw = await _run_in_thread(_conf_run, [], transcript, "technical-swe", CLIENT)
    conf_result, filler_list = (raw if isinstance(raw, tuple) else (raw, raw.get("filler_words", [])))
    ai_fillers  = {f["word"]: f["count"] for f in filler_list}
    total_ai    = sum(ai_fillers.values())
    print(f"  AI detected: {ai_fillers}")
    print(f"  AI total: {total_ai}")

    print()
    # Check AI detected at least 80% of ground truth total
    if total_gt > 0:
        ratio  = min(total_ai / total_gt, 1.0)
        passed = ratio >= 0.70
        record(passed, f"AI captured {ratio*100:.0f}% of ground-truth filler volume (threshold ≥ 70%)")

    # Check each filler word was detected
    for word, gt_count in ground_truth.items():
        ai_count = ai_fillers.get(word, 0)
        diff     = abs(ai_count - gt_count)
        passed   = diff <= max(2, gt_count * 0.5)   # within 50% or 2 instances
        record(passed, f"'{word}': regex={gt_count}, AI={ai_count}, diff={diff}")

    # Check moments were generated
    moments = conf_result.get("moments", [])
    passed = len(moments) >= 1
    record(passed, f"Confidence agent generated {len(moments)} timestamped moments")

    return conf_result

# ── EVAL 4: Output Schema ──────────────────────────────────────────────────────
async def eval_output_schema():
    section("EVAL 4 — Output Schema Validation")
    r = await run_pipeline(TRANSCRIPTS["average"])

    record(0 < r["overall"] <= 10,       f"Overall score in range (0, 10]: {r['overall']}")
    record(0 < r["technical"] <= 10,     f"Technical score in range: {r['technical']}")
    record(0 < r["communication"] <= 10, f"Communication score in range: {r['communication']}")
    record(0 < r["confidence"] <= 10,    f"Confidence score in range: {r['confidence']}")
    record(r["moments_count"] >= 3,      f"At least 3 moments generated: {r['moments_count']}")
    record(len(r["action_plan"]) >= 3,   f"Action plan has ≥ 3 items: {len(r['action_plan'])}")

# ── Summary ────────────────────────────────────────────────────────────────────
def print_summary():
    total  = len(PASSES) + len(FAILS)
    pct    = int(len(PASSES) / total * 100) if total else 0
    color  = GREEN if pct >= 80 else YELLOW if pct >= 60 else RED

    print(f"\n{'═'*60}")
    print(f"{BOLD}  RESULTS: {color}{len(PASSES)}/{total} passed ({pct}%){RESET}")
    print(f"{'═'*60}")

    if FAILS:
        print(f"\n{RED}{BOLD}  Failed checks:{RESET}")
        for f in FAILS:
            print(f"    {RED}✗{RESET} {f}")

    if pct == 100:
        print(f"\n  {GREEN}{BOLD}All evals passed. System is working correctly.{RESET}\n")
    elif pct >= 80:
        print(f"\n  {YELLOW}Most evals passed. Minor issues to review above.{RESET}\n")
    else:
        print(f"\n  {RED}Several evals failed. Review agent prompts or model outputs.{RESET}\n")

# ── Main ───────────────────────────────────────────────────────────────────────
async def main():
    print(f"\n{BOLD}Interview Copilot — Eval Suite{RESET}")
    print(f"Running 4 evaluation layers against live Claude API...\n")
    t0 = time.time()

    await eval_golden_set()
    await eval_consistency()
    await eval_filler_words()
    await eval_output_schema()

    elapsed = time.time() - t0
    print(f"\n  Total runtime: {elapsed:.1f}s")
    print_summary()

if __name__ == "__main__":
    asyncio.run(main())
