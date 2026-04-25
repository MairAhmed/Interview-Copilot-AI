import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { saveSession } from '../utils/sessions'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts'
import {
  Brain, Mic, MessageSquare, Target, ChevronDown, ChevronUp,
  RotateCcw, CheckCircle, AlertCircle, Lightbulb, TrendingUp, TrendingDown, Minus,
  FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import Nav from '../components/Nav'
import PageTransition from '../components/PageTransition'

// ─── Demo fallback ─────────────────────────────────────────────────────────────
const DEMO_RESULT = {
  overall_score: 6.1,
  interview_type: 'technical-swe',
  duration: 214,
  prev_score: 5.5,
  summary: "You have solid foundational knowledge but you're burying it under constant hedging. Said 'I think' 9 times in under 4 minutes. Every correct answer was undermined by your own language. Fix your confidence and your technical score jumps immediately.",
  scores: {
    technical: {
      score: 7.0,
      prev_score: 6.4,
      summary: "Good grasp of fundamentals. You correctly explained stacks and queues and mentioned hash maps unprompted. But you never once discussed time complexity — that's expected at any SWE interview — and your system design missed collision handling entirely.",
      strengths: ["Correctly explained LIFO vs. FIFO with real-world examples", "Mentioned hash maps unprompted — shows initiative"],
      weaknesses: ["Never discussed Big-O complexity for any answer — automatic red flag at FAANG", "URL shortener design missing: collision handling, custom aliases, expiration TTL", "No mention of trade-offs or scalability considerations"],
      moments: [
        { timestamp: 12, end_timestamp: 28, type: "strength", title: "Strong data structure explanation", description: "Clearly articulated LIFO vs. FIFO and used a real-world analogy. This is exactly right.", agent: "technical" },
        { timestamp: 54, end_timestamp: 72, type: "weakness", title: "Missing Big-O — critical gap", description: "You described the hash map but never said O(1). At any SWE interview, omitting complexity analysis is a red flag. Always say it, even unprompted.", agent: "technical" },
        { timestamp: 118, end_timestamp: 155, type: "weakness", title: "URL shortener missing edge cases", description: "You described the basic flow (hash → short URL → redirect) but skipped collision handling, custom slugs, and TTL expiration. These are table stakes for system design.", agent: "technical" },
        { timestamp: 170, end_timestamp: 185, type: "tip", title: "Add trade-off discussion", description: "For any design question, always end with: 'The trade-off here is X vs. Y, and I chose X because…' It shows senior-level thinking.", agent: "technical" },
      ]
    },
    communication: {
      score: 6.5,
      prev_score: 6.1,
      summary: "Your answers had structure but you consistently buried the punchline. You spent 15–20 seconds on context before stating your point. In interviews, lead with the answer first — then explain. You also rambled on question 2, losing the thread around the 2-minute mark.",
      strengths: ["Used a concrete example in your first answer", "Logical flow in the system design walkthrough"],
      weaknesses: ["Answers are bottom-heavy — context before punchline", "Rambled for 90+ seconds without a closing statement on Q2", "Never summarized or closed any answer — just trailed off"],
      moments: [
        { timestamp: 42, end_timestamp: 58, type: "tip", title: "Lead with the answer", description: "You spent 16 seconds on context before stating your point. Flip it: 'A stack is LIFO — here's why that matters.' State the answer in the first sentence.", agent: "communication" },
        { timestamp: 95, end_timestamp: 148, type: "weakness", title: "Answer lost structure at 1:35", description: "Around 1:35 your answer became a stream of consciousness. Apply STAR: Situation → Task → Action → Result. It would have kept this tight and impressive.", agent: "communication" },
        { timestamp: 188, end_timestamp: 200, type: "tip", title: "Always close your answers", description: "You trailed off instead of closing. End every answer with: 'So to summarize, the key reason I'd choose X is Y.' It signals you're done and leaves a strong impression.", agent: "communication" },
      ]
    },
    confidence: {
      score: 4.8,
      prev_score: 3.9,
      summary: "This is your biggest issue. You used 'I think' 9 times and 'I guess' 5 times — often when you were completely correct. You also said 'I'm not sure if this is right' twice, which is a credibility killer. You know the material. Stop signaling that you don't.",
      strengths: ["Steady speaking pace throughout", "No long awkward silences"],
      weaknesses: ["'I think' used 9 times — removes authority from correct statements", "'I'm not sure if this is right' said twice — never say this in an interview", "Upward inflection on statements makes them sound like questions"],
      moments: [
        { timestamp: 18, end_timestamp: 26, type: "weakness", title: "'I think it's like a stack…'", description: "You ARE correct — but 'I think it's like' sounds like a guess. Say: 'A stack uses LIFO ordering.' Period. Own it.", agent: "confidence" },
        { timestamp: 70, end_timestamp: 80, type: "weakness", title: "'I'm not sure if this is right'", description: "Never say this. If uncertain, say: 'One approach would be…' or 'I'd consider…' — signals thinking, not uncertainty. You said this right before a correct answer.", agent: "confidence" },
        { timestamp: 160, end_timestamp: 172, type: "strength", title: "Assertive closing statement", description: "Your final sentence was direct and confident. This is the energy every answer should have from the start.", agent: "confidence" },
      ]
    }
  },
  filler_words: [
    { word: "i think", count: 9 },
    { word: "um", count: 7 },
    { word: "like", count: 6 },
    { word: "i guess", count: 5 },
    { word: "basically", count: 4 },
    { word: "you know", count: 3 },
  ],
  full_text: `Interviewer: Explain the difference between a stack and a queue, with real-world examples.

Candidate: Um, so I think a stack and a queue are both data structures. I think a stack is like LIFO, which means last in first out? And a queue is FIFO. Like, I guess an example of a queue would be like a line at a store. And a stack would be like, I think it's browser history or something. They basically both store elements but the order you get them out is different.

Interviewer: How does a hash map work internally?

Candidate: A hash map basically uses a hash function to convert keys to indices. So when you add something, it hashes the key and stores the value at that index in an array. I think the issue is collisions, where two keys go to the same spot. I know chaining uses a linked list at each bucket. Lookup is usually constant time which is like why hash maps are so useful. I guess in bad cases it could be slower but normally it's fast, you know.

Interviewer: Design a URL shortener at scale.

Candidate: Okay so um, I think you need to take a long URL and give back a short code. I'd basically hash the URL to generate the code. You'd store the mapping in a database and when someone visits the short URL you look it up and redirect them. I'd add a cache for popular URLs so you're not hitting the database every time. I think that covers the main parts. I guess you'd need some way to handle if a lot of people are using it at once but I'm not totally sure on the details of that, like I haven't done much system design before.`,
  transcript: [],
  action_plan: [
    "Record yourself for 5 minutes talking about your last project. Count every 'I think', 'I guess', and 'um'. The goal: zero. Replace each with a direct statement.",
    "Before every answer, state your conclusion first — then explain. Practice BLUF (Bottom Line Up Front) in every conversation this week.",
    "For any algorithm or data structure you mention: immediately follow with its Big-O complexity. Even unprompted. Always.",
    "End every interview answer with a one-sentence summary. Never trail off. 'So in short, I'd choose X because Y.' Practice this until it's automatic.",
    "For system design: build a 3-item mental checklist — (1) basic flow, (2) edge cases / failure modes, (3) trade-offs. Run through it on every design question.",
  ]
}

// ─── Config ────────────────────────────────────────────────────────────────────
const AGENT_META = {
  technical:     { label: 'Technical',     color: '#6366f1', Icon: Brain,          weight: '40%' },
  communication: { label: 'Communication', color: '#8b5cf6', Icon: MessageSquare,  weight: '35%' },
  confidence:    { label: 'Confidence',    color: '#a78bfa', Icon: Mic,            weight: '25%' },
}

const MOMENT_STYLE = {
  strength: { Icon: CheckCircle, color: 'text-green-400',  border: 'border-green-500/20',  bg: 'bg-green-500/5',  label: 'Strength' },
  weakness: { Icon: AlertCircle, color: 'text-red-400',    border: 'border-red-500/20',    bg: 'bg-red-500/5',    label: 'Weakness' },
  tip:      { Icon: Lightbulb,   color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', label: 'Tip'      },
}

// ─── Delta badge ───────────────────────────────────────────────────────────────
function DeltaBadge({ current, previous, size = 'sm' }) {
  if (previous == null) return null
  const delta = current - previous
  const abs = Math.abs(delta).toFixed(1)
  if (Math.abs(delta) < 0.05) return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
      <Minus className="w-3 h-3" /> no change
    </span>
  )
  const up = delta > 0
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 font-bold rounded-full px-2 py-0.5',
      size === 'lg' ? 'text-sm' : 'text-xs',
      up ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
    )}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : '-'}{abs} from last session
    </span>
  )
}

// ─── Animated score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, delay = 0 }) {
  const r       = size / 2 - 10
  const circ    = 2 * Math.PI * r
  const target  = circ * (1 - score / 10)
  const color   = score >= 7.5 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444'
  const [offset, setOffset] = useState(circ)

  useEffect(() => {
    const t = setTimeout(() => setOffset(target), 100 + delay)
    return () => clearTimeout(t)
  }, [target, delay])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111113" strokeWidth={8} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black" style={{ color, fontSize: size > 100 ? '2rem' : '1.25rem', lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span className="text-xs text-gray-600">/10</span>
      </div>
    </div>
  )
}

// ─── Agent card ────────────────────────────────────────────────────────────────
function AgentCard({ name, data, delay }) {
  const [open, setOpen] = useState(false)
  const { label, color, Icon, weight } = AGENT_META[name]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card card-hover"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold">{label} Agent</h3>
            <span className="text-xs text-gray-600 font-mono">{weight} weight</span>
            <DeltaBadge current={data.score} previous={data.prev_score} />
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{data.summary}</p>
        </div>
        <ScoreRing score={data.score} size={72} delay={delay} />
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {open ? 'Hide' : 'View'} full breakdown
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2">Strengths</p>
                <ul className="space-y-2">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Areas to Improve</p>
                <ul className="space-y-2">
                  {data.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-300">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Timeline ──────────────────────────────────────────────────────────────────
const TRACK_COLOR = { strength: '#22c55e', weakness: '#ef4444', tip: '#f59e0b' }

function Timeline({ scores, duration }) {
  const [selected, setSelected] = useState(null)
  const [hoveredDot, setHoveredDot] = useState(null)

  const moments = Object.entries(scores)
    .flatMap(([agent, data]) => (data.moments || []).map(m => ({ ...m, agent })))
    .sort((a, b) => a.timestamp - b.timestamp)

  if (!moments.length) return null

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
  const totalDur = duration || moments[moments.length - 1]?.end_timestamp || 60

  return (
    <div className="card">
      <h3 className="font-bold text-lg mb-1">Moment-by-Moment Timeline</h3>
      <p className="text-sm text-gray-500 mb-5">Click any moment to see the AI's exact feedback.</p>

      <div className="relative mb-6">
        <div className="h-1.5 rounded-full w-full" style={{ background: 'linear-gradient(90deg, #111113, #111113)' }} />
        {moments.map((m, i) => {
          const pct = Math.min((m.timestamp / totalDur) * 100, 98)
          const color = TRACK_COLOR[m.type]
          return (
            <button
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              onMouseEnter={() => setHoveredDot(i)}
              onMouseLeave={() => setHoveredDot(null)}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform hover:scale-150"
              style={{ left: `${pct}%` }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 transition-all"
                style={{
                  background: color,
                  borderColor: '#09090b',
                  boxShadow: selected === i ? `0 0 10px ${color}` : 'none'
                }}
              />
              {hoveredDot === i && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#111113] border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap text-xs z-10 pointer-events-none shadow-xl">
                  {fmt(m.timestamp)} · {m.title}
                </div>
              )}
            </button>
          )
        })}
        <div className="flex justify-between mt-2 text-xs text-gray-700 font-mono">
          <span>0:00</span>
          <span>{fmt(totalDur)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {moments.map((m, i) => {
          const { Icon, color, border, bg, label } = MOMENT_STYLE[m.type]
          const isOpen = selected === i
          const agentMeta = AGENT_META[m.agent]
          return (
            <div
              key={i}
              className={clsx('border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer', border, bg, isOpen && 'ring-1 ring-white/10 shadow-lg')}
            >
              <button
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
                onClick={() => setSelected(isOpen ? null : i)}
              >
                <Icon className={clsx('w-4 h-4 shrink-0', color)} />
                <span className="font-mono text-xs text-gray-500 w-10 shrink-0">{fmt(m.timestamp)}</span>
                <span className={clsx('text-xs font-bold uppercase tracking-wider w-20 shrink-0', color)}>{label}</span>
                <span className="text-sm font-semibold flex-1 truncate">{m.title}</span>
                <span className="text-xs text-gray-600 shrink-0 hidden sm:block">{agentMeta?.label}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-white/5">
                      <p className="text-sm text-gray-200 leading-relaxed">{m.description}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 mt-4 pt-4 border-t border-white/[0.06]">
        {Object.entries(MOMENT_STYLE).map(([type, { color, label }]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: TRACK_COLOR[type] }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Score comparison bar ──────────────────────────────────────────────────────
function CompareBar({ label, current, previous, color }) {
  const [width, setWidth] = useState(0)
  const [prevWidth, setPrevWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setWidth((current / 10) * 100)
      setPrevWidth(previous != null ? (previous / 10) * 100 : 0)
    }, 300)
    return () => clearTimeout(t)
  }, [current, previous])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {previous != null && (
            <span className="text-xs text-gray-600 font-mono">{previous.toFixed(1)}</span>
          )}
          <span className="font-bold" style={{ color }}>{current.toFixed(1)}</span>
        </div>
      </div>
      <div className="relative h-2 bg-white/[0.05] rounded-full overflow-hidden">
        {previous != null && (
          <div
            className="absolute top-0 left-0 h-full rounded-full opacity-30 transition-all duration-1000"
            style={{ width: `${prevWidth}%`, background: color }}
          />
        )}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
          style={{ width: `${width}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
    </div>
  )
}

// ─── Transcript panel ──────────────────────────────────────────────────────────
const FILLER_COLORS = {
  default: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
}

function highlightFillers(text, fillerWords) {
  if (!text || !fillerWords?.length) return [{ text, highlighted: false }]

  const escaped = fillerWords
    .map(f => f.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)   // longest first avoids partial matches

  const regex  = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
  const parts  = []
  let last     = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), highlighted: false })
    parts.push({ text: match[0], highlighted: true })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), highlighted: false })
  return parts
}

function TranscriptPanel({ fullText, fillerWords }) {
  const [open, setOpen] = useState(false)
  const hasText = fullText && fullText.trim().length > 0

  if (!hasText) return null

  const parts       = highlightFillers(fullText, fillerWords)
  const fillerCount = fillerWords?.reduce((s, f) => s + f.count, 0) || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38, duration: 0.5 }}
      className="card"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 text-left"
      >
        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight">Interview Transcript</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Full text · {fillerCount > 0 && <span className="text-amber-400">{fillerCount} filler word{fillerCount !== 1 ? 's' : ''} highlighted</span>}
            {fillerCount === 0 && 'No filler words detected'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {fillerCount > 0 && (
            <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/20 rounded-full px-2.5 py-0.5 font-medium">
              {fillerCount} fillers
            </span>
          )}
          {open
            ? <ChevronUp className="w-5 h-5 text-gray-500" />
            : <ChevronDown className="w-5 h-5 text-gray-500" />
          }
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              {/* Legend */}
              {fillerCount > 0 && (
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                  <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-medium">highlighted</span>
                  <span>= filler word detected by the Confidence Agent</span>
                </div>
              )}

              {/* Transcript text */}
              <div className="bg-[#09090b] rounded-xl p-5 text-sm leading-8 text-gray-300 max-h-96 overflow-y-auto font-mono whitespace-pre-wrap">
                {parts.map((part, i) =>
                  part.highlighted
                    ? (
                      <mark
                        key={i}
                        className="bg-amber-500/25 text-amber-200 border border-amber-500/30 rounded px-0.5 not-italic"
                      >
                        {part.text}
                      </mark>
                    )
                    : <span key={i}>{part.text}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Results page ──────────────────────────────────────────────────────────────
export default function Results() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const savedRef  = useRef(false)
  const isReal    = !!location.state?.result   // came from real analysis
  const result    = location.state?.result || DEMO_RESULT

  // Persist real results to localStorage (only once per page load)
  useEffect(() => {
    if (isReal && !savedRef.current) {
      savedRef.current = true
      const saved = saveSession(result)
      // Attach prev_score from storage so delta banner works
      if (saved?.prev_score != null && result.prev_score == null) {
        result.prev_score = saved.prev_score
      }
    }
  }, [])   // eslint-disable-line

  const radarData = Object.entries(result.scores).map(([key, val]) => ({
    subject: AGENT_META[key]?.label || key,
    score: val.score,
    fullMark: 10,
  }))

  const barData = (result.filler_words || []).slice(0, 6).map(f => ({
    word: f.word, count: f.count,
  }))

  const fmtDuration = s => s > 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`
  const scoreColor  = s => s >= 7.5 ? '#22c55e' : s >= 5 ? '#f59e0b' : '#ef4444'

  const delta = result.prev_score != null ? result.overall_score - result.prev_score : null
  const isImproved = delta != null && delta > 0

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Nav />

        <div className="max-w-5xl mx-auto w-full px-6 py-10 space-y-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <p className="text-sm text-indigo-400 font-medium uppercase tracking-widest mb-3">
              {(result.interview_type || 'general').replace(/-/g, ' ')} · {fmtDuration(Math.round(result.duration))}
            </p>
            <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text">Your Interview Report</h1>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">{result.summary}</p>
          </motion.div>

          {/* Improvement banner */}
          {delta != null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className={clsx(
                'rounded-2xl border px-6 py-4 flex items-center gap-4',
                isImproved
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              )}
            >
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                isImproved ? 'bg-green-500/15' : 'bg-amber-500/15'
              )}>
                {isImproved
                  ? <TrendingUp className="w-5 h-5 text-green-400" />
                  : <TrendingDown className="w-5 h-5 text-amber-400" />
                }
              </div>
              <div>
                <p className={clsx('font-bold text-sm', isImproved ? 'text-green-300' : 'text-amber-300')}>
                  {isImproved
                    ? `You improved by ${delta.toFixed(1)} points since your last session`
                    : `Score is ${Math.abs(delta).toFixed(1)} points below your last session`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Last session: {result.prev_score.toFixed(1)} → This session: {result.overall_score.toFixed(1)}
                  {isImproved ? ' — keep the momentum going.' : ' — review the action plan below.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Overall + Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-5 gap-6"
          >
            {/* Overall score */}
            <div className="md:col-span-2 card flex flex-col items-center justify-center gap-4 py-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Overall Score</p>
              <ScoreRing score={result.overall_score} size={160} delay={200} />
              {delta != null && (
                <DeltaBadge current={result.overall_score} previous={result.prev_score} size="lg" />
              )}
              <div className="w-full px-4 space-y-3 mt-2">
                {Object.entries(result.scores).map(([key, val]) => (
                  <CompareBar
                    key={key}
                    label={AGENT_META[key]?.label}
                    current={val.score}
                    previous={val.prev_score}
                    color={AGENT_META[key]?.color}
                  />
                ))}
              </div>
            </div>

            {/* Radar */}
            <div className="md:col-span-3 card">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-1">Performance Radar</p>
              <p className="text-xs text-gray-600 mb-4">All three dimensions visualized</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#111113" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                  <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.18} strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Timeline scores={result.scores} duration={result.duration} />
          </motion.div>

          {/* Agent cards */}
          <div>
            <h2 className="text-xl font-bold mb-4">Agent Breakdown</h2>
            <div className="space-y-4">
              {Object.entries(result.scores).map(([key, val], i) => (
                <AgentCard key={key} name={key} data={val} delay={(i + 1) * 80} />
              ))}
            </div>
          </div>

          {/* Filler words */}
          {barData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="card"
            >
              <h3 className="font-bold text-lg mb-1">Filler Words Detected</h3>
              <p className="text-sm text-gray-500 mb-5">These reduce perceived confidence. The goal is zero.</p>
              <ResponsiveContainer width="100%" height={barData.length * 40}>
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="word" tick={{ fill: '#d1d5db', fontSize: 13, fontWeight: 600 }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f9fafb', fontSize: 13 }}
                    cursor={{ fill: '#111113' }}
                    formatter={(v) => [`${v} times`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={28}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e'][i] || '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Transcript panel */}
          <TranscriptPanel
            fullText={result.full_text}
            fillerWords={result.filler_words}
          />

          {/* Action plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="card border-indigo-600/25 bg-indigo-600/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-bold text-lg">Your Action Plan</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">Top 5 improvements, ordered by impact. Do these before your next interview.</p>
            <ol className="space-y-4">
              {result.action_plan.map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="w-7 h-7 bg-indigo-600/25 text-indigo-400 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed">{item}</p>
                </li>
              ))}
            </ol>

            <div className="mt-8 pt-6 border-t border-indigo-600/20 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/interview?mode=live')}
                className="btn-primary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Practice Again
              </button>
              <button
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-2"
              >
                ↓ Save Report
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary flex items-center gap-2"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </PageTransition>
  )
}
