import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Brain, Mic, MessageSquare, Target, ArrowRight, Upload,
  Monitor, CheckCircle, ChevronRight, Zap, Shield, BarChart2,
  TrendingUp, AlertCircle
} from 'lucide-react'

// ─── Typing headline ───────────────────────────────────────────────────────────
const HEADLINES = [
  "Know exactly why you didn't get the job.",
  "Turn vague rejections into a real action plan.",
  "Practice like the interview already happened.",
]

function TypingHeadline() {
  const [idx, setIdx]           = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const target = HEADLINES[idx]
    if (!deleting && displayed.length < target.length) {
      const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 36)
      return () => clearTimeout(t)
    }
    if (!deleting && displayed.length === target.length) {
      const t = setTimeout(() => setDeleting(true), 2600)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 16)
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
      <span className="inline-block w-[3px] h-[0.9em] bg-indigo-400 ml-1 align-middle rounded-sm"
        style={{ animation: 'blink 1s step-end infinite' }} />
    </span>
  )
}

// ─── Fade-in-view wrapper ──────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '', direction = 'up' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 24 : direction === 'down' ? -24 : 0,
      x: direction === 'left' ? 24 : direction === 'right' ? -24 : 0,
    },
    visible: { opacity: 1, y: 0, x: 0 },
  }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Agent cards ───────────────────────────────────────────────────────────────
const AGENTS = [
  {
    icon: Brain,
    color: '#6366f1',
    gradient: 'from-indigo-500/10 to-indigo-500/0',
    label: 'Technical',
    weight: '40%',
    blurb: 'Scores your depth, accuracy, Big-O awareness, and system design completeness — the things interviewers notice and never say.',
    checks: ['Concept accuracy', 'Complexity analysis', 'Edge case coverage', 'System design gaps'],
  },
  {
    icon: MessageSquare,
    color: '#8b5cf6',
    gradient: 'from-violet-500/10 to-violet-500/0',
    label: 'Communication',
    weight: '35%',
    blurb: "Detects whether you're burying the punchline, rambling, or trailing off — and tells you the exact timestamp where it happened.",
    checks: ['BLUF vs bottom-heavy', 'Answer structure', 'Rambling detection', 'Closing statements'],
  },
  {
    icon: Mic,
    color: '#ec4899',
    gradient: 'from-pink-500/10 to-pink-500/0',
    label: 'Confidence',
    weight: '25%',
    blurb: "Counts every 'I think', 'I guess', and 'um' — especially the ones right before a correct answer. You know the material. Stop signaling that you don't.",
    checks: ['Filler word count', 'Hedging language', 'Upward inflection', 'Self-undermining phrases'],
  },
  {
    icon: Target,
    color: '#f59e0b',
    gradient: 'from-amber-500/10 to-amber-500/0',
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
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/15',
  },
  {
    icon: Upload,
    title: 'Upload a Recording',
    desc: 'Drop in a Zoom, Teams, phone recording, or any audio/video file.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/15',
  },
  {
    icon: Monitor,
    title: 'Capture Live Meeting',
    desc: 'Run alongside a live Zoom/Teams call — captures both sides of the conversation in real time.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/15',
  },
]

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate  = useNavigate()
  const [name, setName]       = useState('')
  const [nameError, setNameError] = useState(false)

  const handleStart = (e) => {
    e?.preventDefault()
    const n = name.trim()
    if (!n) { setNameError(true); document.getElementById('hero-name')?.focus(); return }
    localStorage.setItem('ic_name', n)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#080c14] overflow-x-hidden">
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
      `}</style>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="border-b border-white/[0.05] px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/40">
            <Brain className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight">Interview Copilot</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const stored = localStorage.getItem('ic_name')
              if (stored) navigate('/dashboard')
              else document.getElementById('hero-name')?.focus()
            }}
            className="hidden sm:block text-sm text-gray-500 hover:text-white transition-colors px-3 py-1.5"
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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative px-6 md:px-10 pt-24 pb-28 hero-mesh">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-30"
            style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.25) 0%, transparent 65%)' }} />
          <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] opacity-20"
            style={{ background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.3) 0%, transparent 65%)' }} />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight mb-6"
              style={{ minHeight: '1.2em' }}>
              <TypingHeadline />
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed mb-10">
              Four AI agents analyze your interview — scoring technical depth, communication, and confidence — and hand you a specific action plan. Not vague advice. Exact fixes.
            </p>

            {/* Name CTA */}
            <form onSubmit={handleStart} className="max-w-sm mx-auto space-y-3">
              <input
                id="hero-name"
                type="text"
                placeholder="Your first name"
                value={name}
                onChange={e => { setName(e.target.value); setNameError(false) }}
                className={`w-full bg-white/[0.05] border rounded-xl px-5 py-3.5 text-white placeholder-gray-600 focus:outline-none transition-all text-center font-medium text-[15px] ${
                  nameError
                    ? 'border-red-500/50 focus:border-red-500 bg-red-500/5'
                    : 'border-white/[0.08] focus:border-indigo-500/60 focus:bg-white/[0.07]'
                }`}
              />
              {nameError && (
                <p className="text-xs text-red-400 flex items-center justify-center gap-1.5">
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
              <p className="text-xs text-gray-600">
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
          </motion.div>

          {/* Social proof row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center justify-center gap-6 mt-14 flex-wrap"
          >
            {[
              { icon: Zap,       text: '4 AI agents' },
              { icon: BarChart2, text: '3 dimensions scored' },
              { icon: Shield,    text: 'Runs locally — fully private' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-gray-500">
                <Icon className="w-4 h-4 text-gray-600" />
                {text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider-glow mx-auto max-w-5xl" />

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-24 max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="section-label">How it works</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">From recording to action plan in under a minute</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              n: '1',
              icon: Mic,
              title: 'Record your interview',
              body: 'Practice live with AI questions, upload a Zoom/Teams recording, or capture a real interview happening right now alongside your call.',
            },
            {
              n: '2',
              icon: Brain,
              title: 'Agents analyze in parallel',
              body: 'Technical, Communication, and Confidence agents run simultaneously on your transcript. The Synthesizer combines all three into one report.',
            },
            {
              n: '3',
              icon: TrendingUp,
              title: 'Get your action plan',
              body: 'Not "be more confident." Instead: the exact moments, word counts, and a ranked 5-step plan to fix them before your next interview.',
            },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={i * 0.1}>
              <div className="landing-card h-full flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-600/20 flex items-center justify-center text-xs font-black text-indigo-400">
                    {step.n}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[15px] mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="divider-glow mx-auto max-w-5xl" />

      {/* ── Agents ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-24 max-w-5xl mx-auto">
        <FadeIn className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="section-label">The AI agents</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Four specialists. One report.</h2>
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed md:text-right">
              Each agent runs independently, so there's no cross-contamination. You get four honest opinions.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AGENTS.map((a, i) => (
            <FadeIn key={a.label} delay={i * 0.08}>
              <div className={`landing-card h-full bg-gradient-to-br ${a.gradient} flex flex-col gap-5`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: a.color + '18' }}>
                      <a.icon className="w-5 h-5" style={{ color: a.color }} />
                    </div>
                    <div>
                      <p className="font-bold">{a.label} Agent</p>
                      <p className="text-xs text-gray-600">{a.weight === 'Final synthesis' ? 'Final synthesis' : `${a.weight} of score`}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 leading-relaxed">{a.blurb}</p>

                <div className="grid grid-cols-2 gap-1.5 mt-auto">
                  {a.checks.map(c => (
                    <div key={c} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <CheckCircle className="w-3 h-3 shrink-0" style={{ color: a.color + 'bb' }} />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="divider-glow mx-auto max-w-5xl" />

      {/* ── Recording modes ───────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-24 max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="section-label">Three ways to use it</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Works with how you already interview</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODES.map((m, i) => (
            <FadeIn key={m.title} delay={i * 0.1}>
              <div className={`landing-card h-full border ${m.border}`}>
                <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <h3 className="font-bold mb-2">{m.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="divider-glow mx-auto max-w-5xl" />

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-28 max-w-2xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Stop guessing.<br />
            <span className="gradient-text">Start improving.</span>
          </h2>
          <p className="text-gray-400 mb-10 leading-relaxed max-w-md mx-auto">
            Every candidate who doesn't get the job deserves to know exactly why. This is that tool.
          </p>
          <form onSubmit={handleStart} className="max-w-xs mx-auto space-y-3">
            <input
              type="text"
              placeholder="Your first name"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(false) }}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-5 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all text-center font-medium text-[15px]"
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
      <footer className="border-t border-white/[0.05] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Interview Copilot</span>
          </div>
          <p className="text-xs text-gray-700">AI-powered interview coaching · All processing runs locally</p>
        </div>
      </footer>

    </div>
  )
}
