import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Brain, Mic, MessageSquare, Target, ArrowRight, Upload,
  Monitor, CheckCircle, Zap, Shield, TrendingUp, AlertCircle,
  BarChart3, Clock, ChevronRight
} from 'lucide-react'

// ─── Typing headline ───────────────────────────────────────────────────────────
const HEADLINES = [
  "Know exactly why you didn't get the job.",
  "Turn vague rejections into a real action plan.",
  "Practice like the interview already happened.",
]

function TypingHeadline() {
  const [idx, setIdx]             = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    const target = HEADLINES[idx]
    if (!deleting && displayed.length < target.length) {
      const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 36)
      return () => clearTimeout(t)
    }
    if (!deleting && displayed.length === target.length) {
      const t = setTimeout(() => setDeleting(true), 2800)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 14)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false)
      setIdx(i => (i + 1) % HEADLINES.length)
    }
  }, [displayed, deleting, idx])

  return (
    <span>
      {displayed}
      <span
        className="inline-block w-[3px] h-[0.85em] bg-indigo-400 ml-1 align-middle rounded-sm"
        style={{ animation: 'blink 1s step-end infinite' }}
      />
    </span>
  )
}

// ─── Fade-in-view wrapper ──────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '', direction = 'up' }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: direction === 'up' ? 24 : direction === 'down' ? -24 : 0, x: direction === 'left' ? 24 : direction === 'right' ? -24 : 0 }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Product preview card (hero visual) ────────────────────────────────────────
function ProductPreview() {
  const bars = [
    { label: 'Technical',     score: 8.8, color: '#818cf8', width: '88%' },
    { label: 'Communication', score: 8.1, color: '#a78bfa', width: '81%' },
    { label: 'Confidence',    score: 8.4, color: '#c084fc', width: '84%' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative max-w-sm mx-auto mt-14 animate-float"
    >
      {/* Glow behind the card */}
      <div
        className="absolute inset-[-20%] rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
      />

      <div
        className="relative rounded-2xl text-left overflow-hidden"
        style={{
          background: 'rgba(17,17,19,0.85)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 48px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top bar */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">Interview Report</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-gray-700" />
            <span className="text-[11px] text-gray-600">4m 32s</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Score header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white leading-none">8.4</span>
                <span className="text-sm text-gray-600">/10</span>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: '#4ade80', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.18)' }}
                >
                  +1.2 ↑
                </span>
              </div>
            </div>
            <div
              className="text-[10px] font-medium px-2.5 py-1 rounded-full"
              style={{ color: '#818cf8', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.18)' }}
            >
              Technical — SWE
            </div>
          </div>

          {/* Score bars */}
          <div className="space-y-2.5 mb-5">
            {bars.map(({ label, score, color, width }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500 w-28 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width, background: color, boxShadow: `0 0 8px ${color}60` }}
                  />
                </div>
                <span className="text-[11px] font-bold w-6 text-right tabular-nums" style={{ color }}>{score}</span>
              </div>
            ))}
          </div>

          {/* Top issue */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-[10px] text-red-500 uppercase tracking-widest font-semibold mb-1">Top Issue</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Said <span className="text-amber-300 font-semibold">"I think"</span> 9× — undermining technically correct answers with your own words
            </p>
          </div>

          {/* Agent badges */}
          <div className="flex gap-1.5 mt-3.5 flex-wrap">
            {['Technical ✓', 'Communication ✓', 'Confidence ✓'].map(label => (
              <span
                key={label}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ color: '#6b7280', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Agents ────────────────────────────────────────────────────────────────────
const AGENTS = [
  {
    icon: Brain,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.08)',
    label: 'Technical',
    weight: '40% of score',
    blurb: 'Scores depth, accuracy, Big-O awareness, and system design completeness — the things interviewers notice and never tell you.',
    checks: ['Concept accuracy', 'Complexity analysis', 'Edge case coverage', 'System design gaps'],
  },
  {
    icon: MessageSquare,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    label: 'Communication',
    weight: '35% of score',
    blurb: "Detects if you're burying the punchline, rambling, or trailing off — with the exact timestamp where it happened.",
    checks: ['BLUF vs bottom-heavy', 'Answer structure', 'Rambling detection', 'Closing statements'],
  },
  {
    icon: Mic,
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.08)',
    label: 'Confidence',
    weight: '25% of score',
    blurb: "Counts every 'I think', 'I guess', and 'um' — especially the ones right before a correct answer. You know the material. Stop signaling you don't.",
    checks: ['Filler word count', 'Hedging language', 'Upward inflection', 'Self-undermining phrases'],
  },
  {
    icon: Target,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.08)',
    label: 'Synthesizer',
    weight: 'Final synthesis',
    blurb: 'Combines all three agents into a ranked 5-item action plan. Each item is specific enough to act on before your next interview.',
    checks: ['Cross-agent synthesis', 'Impact ranking', '5-step action plan', 'Progress tracking'],
  },
]

// ─── Recording modes ───────────────────────────────────────────────────────────
const MODES = [
  {
    icon: Mic,
    title: 'Live Practice',
    desc: 'Answer AI-generated questions in a mock interview. Get scored immediately after.',
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.08)',
    border: 'rgba(129,140,248,0.16)',
  },
  {
    icon: Upload,
    title: 'Upload a Recording',
    desc: 'Drop in a Zoom, Teams, phone recording, or any audio/video file for analysis.',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.16)',
  },
  {
    icon: Monitor,
    title: 'Capture Live Meeting',
    desc: 'Run alongside a live Zoom/Teams call — captures both sides in real time.',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.08)',
    border: 'rgba(192,132,252,0.16)',
  },
]

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const [name, setName]           = useState('')
  const [role, setRole]           = useState('')
  const [interviewDate, setDate]  = useState('')
  const [nameError, setNameError] = useState(false)

  const handleStart = (e) => {
    e?.preventDefault()
    const n = name.trim()
    if (!n) { setNameError(true); document.getElementById('hero-name')?.focus(); return }
    localStorage.setItem('ic_name', n)
    if (role.trim())       localStorage.setItem('ic_role', role.trim())
    if (interviewDate)     localStorage.setItem('ic_interview_date', interviewDate)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#09090b' }}>

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(9,9,11,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
            }}
          >
            <Brain className="w-[17px] h-[17px] text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white">Interview Copilot</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const stored = localStorage.getItem('ic_name')
              if (stored) navigate('/dashboard')
              else document.getElementById('hero-name')?.focus()
            }}
            className="hidden sm:block text-sm text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
          >
            Sign in
          </button>
          <button
            onClick={() => document.getElementById('hero-name')?.focus()}
            className="btn-primary text-sm py-2 px-4"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative px-6 md:px-10 pt-20 pb-10 hero-mesh overflow-hidden">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[600px]"
            style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 65%)' }}
          />
          <div
            className="absolute top-[5%] right-[0%] w-[500px] h-[500px]"
            style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.10) 0%, transparent 60%)' }}
          />
        </div>

        {/* Two-column layout for hero on large screens */}
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{ color: '#818cf8', background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.20)' }}
            >
              <Zap className="w-3 h-3" />
              4 AI agents · Real-time analysis
            </div>

            <h1
              className="text-5xl md:text-6xl font-black leading-[1.06] tracking-tight mb-6 text-white"
              style={{ minHeight: '2.2em' }}
            >
              <TypingHeadline />
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-lg">
              Four AI agents analyze your interview — scoring technical depth, communication, and confidence — then hand you a specific action plan. Not vague advice. Exact fixes.
            </p>

            {/* CTA form */}
            <form onSubmit={handleStart} className="max-w-sm space-y-3">
              <div className="relative">
                <input
                  id="hero-name"
                  type="text"
                  placeholder="Your first name"
                  value={name}
                  onChange={e => { setName(e.target.value); setNameError(false) }}
                  className={`w-full rounded-xl px-5 py-3.5 text-white font-medium text-[15px] text-center transition-all focus:outline-none ${
                    nameError
                      ? 'border border-red-500/50 focus:border-red-500'
                      : 'border border-white/[0.08] focus:border-indigo-500/60'
                  }`}
                  style={{
                    background: nameError ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.05)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.4) inset',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Target role (optional)"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-white text-sm text-center transition-all focus:outline-none border border-white/[0.08] focus:border-indigo-500/60"
                  style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 1px 2px rgba(0,0,0,0.4) inset' }}
                />
                <input
                  type="date"
                  value={interviewDate}
                  onChange={e => setDate(e.target.value)}
                  title="Interview date (optional)"
                  className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none border border-white/[0.08] focus:border-indigo-500/60"
                  style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 1px 2px rgba(0,0,0,0.4) inset', colorScheme: 'dark', color: interviewDate ? 'white' : '#6b7280' }}
                />
              </div>
              {nameError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Enter your name to continue
                </p>
              )}
              <button
                type="submit"
                className="w-full btn-primary py-3.5 text-[15px] flex items-center justify-center gap-2 group"
              >
                Open your dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="text-xs text-gray-600 text-center">
                Or{' '}
                <button
                  type="button"
                  onClick={() => navigate('/interview')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  skip straight to an interview →
                </button>
              </p>
            </form>

            {/* Trust row */}
            <div className="flex items-center gap-5 mt-8 flex-wrap">
              {[
                { icon: Shield,   text: 'Runs locally — fully private' },
                { icon: BarChart3, text: 'Scored on 3 dimensions' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Icon className="w-3.5 h-3.5 text-gray-700" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: product preview */}
          <div className="hidden lg:block">
            <ProductPreview />
          </div>
        </div>

        {/* Mobile: product preview below CTA */}
        <div className="lg:hidden max-w-sm mx-auto">
          <ProductPreview />
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="divider-glow max-w-5xl mx-auto mt-12" />

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-24 max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="section-label">How it works</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">From recording to action plan in under a minute</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              n: '01', icon: Mic, color: '#818cf8',
              title: 'Record your interview',
              body: 'Practice live with AI questions, upload a Zoom/Teams recording, or capture a real interview happening right now alongside your call.',
            },
            {
              n: '02', icon: Brain, color: '#a78bfa',
              title: 'Agents analyze in parallel',
              body: 'Technical, Communication, and Confidence agents run simultaneously on your transcript. The Synthesizer combines all three into one report.',
            },
            {
              n: '03', icon: TrendingUp, color: '#c084fc',
              title: 'Get your action plan',
              body: "Not 'be more confident.' Instead: the exact moments, word counts, and a ranked 5-step plan to fix them before your next interview.",
            },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={i * 0.1}>
              <div className="landing-card h-full flex flex-col gap-4 relative overflow-hidden">
                {/* Step number watermark */}
                <span
                  className="absolute top-4 right-5 font-black tabular-nums select-none pointer-events-none"
                  style={{ fontSize: '3.5rem', lineHeight: 1, color: 'rgba(255,255,255,0.03)' }}
                >
                  {step.n}
                </span>

                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: step.color + '14' }}
                >
                  <step.icon className="w-4.5 h-4.5" style={{ color: step.color, width: 18, height: 18 }} />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] mb-2 text-white">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <div className="divider-glow max-w-5xl mx-auto" />

      {/* ── Agents ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-24 max-w-5xl mx-auto">
        <FadeIn className="mb-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="section-label">The AI agents</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Four specialists. One report.</h2>
            </div>
            <p className="text-sm text-gray-600 max-w-xs leading-relaxed md:text-right">
              Each agent runs independently — no cross-contamination. Four honest opinions.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AGENTS.map((a, i) => (
            <FadeIn key={a.label} delay={i * 0.08}>
              <div className="landing-card h-full flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: a.bg }}
                  >
                    <a.icon className="w-5 h-5" style={{ color: a.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{a.label} Agent</p>
                    <p className="text-xs text-gray-600 mt-0.5">{a.weight}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed">{a.blurb}</p>

                <div className="grid grid-cols-2 gap-y-2 gap-x-3 mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {a.checks.map(c => (
                    <div key={c} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <CheckCircle className="w-3 h-3 shrink-0" style={{ color: a.color + '90' }} />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <div className="divider-glow max-w-5xl mx-auto" />

      {/* ── Recording modes ───────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-24 max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="section-label">Three ways to use it</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Works with how you already interview</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODES.map((m, i) => (
            <FadeIn key={m.title} delay={i * 0.1}>
              <div
                className="landing-card h-full flex flex-col gap-4"
                style={{ borderColor: m.border }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: m.bg }}
                >
                  <m.icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">{m.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <div className="divider-glow max-w-5xl mx-auto" />

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-28 text-center">
        <FadeIn className="max-w-xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-white">
            Stop guessing.<br />
            <span className="gradient-text">Start improving.</span>
          </h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Every candidate who doesn't get the job deserves to know exactly why.
          </p>
          <form onSubmit={handleStart} className="max-w-xs mx-auto space-y-3">
            <input
              type="text"
              placeholder="Your first name"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(false) }}
              className="w-full rounded-xl px-5 py-3.5 text-white font-medium text-[15px] text-center transition-all focus:outline-none border border-white/[0.08] focus:border-indigo-500/60"
              style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 1px 2px rgba(0,0,0,0.4) inset' }}
            />
            <button
              type="submit"
              className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 group"
            >
              Get started — it's free
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </FadeIn>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
            >
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Interview Copilot</span>
          </div>
          <p className="text-xs text-gray-700">AI-powered interview coaching · All processing runs locally</p>
        </div>
      </footer>

    </div>
  )
}
