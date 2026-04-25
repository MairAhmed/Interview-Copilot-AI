import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Area, AreaChart, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import {
  Plus, Brain, Mic, MessageSquare, Target, TrendingUp, TrendingDown,
  ArrowRight, Flame, Clock, ChevronRight, BarChart2, Zap, CheckCircle
} from 'lucide-react'
import clsx from 'clsx'
import Nav from '../components/Nav'
import PageTransition from '../components/PageTransition'
import { getSessions, timeAgo, fmtDuration, typeLabel, typeTag, typeColor } from '../utils/sessions'

// ─── Mock data (fallback when no real sessions yet) ────────────────────────────
const MOCK_SESSIONS = [
  {
    id: 1, type: 'Technical — SWE', tag: 'SWE',
    date: 'Apr 20', daysAgo: '2 days ago', duration: '4m 12s',
    overall: 7.4, technical: 8.1, communication: 7.0, confidence: 6.8,
    topIssue: 'Missed edge cases in system design',
    color: '#6366f1',
  },
  {
    id: 2, type: 'Behavioral', tag: 'BEH',
    date: 'Apr 17', daysAgo: '5 days ago', duration: '6m 38s',
    overall: 6.8, technical: 6.2, communication: 7.4, confidence: 6.5,
    topIssue: 'Answers lacked STAR structure',
    color: '#8b5cf6',
  },
  {
    id: 3, type: 'Product Management', tag: 'PM',
    date: 'Apr 14', daysAgo: '1 week ago', duration: '5m 55s',
    overall: 5.9, technical: 5.5, communication: 6.8, confidence: 5.1,
    topIssue: 'Confidence dragging overall score',
    color: '#a78bfa',
  },
]

const MOCK_TREND = [
  { label: 'Apr 14', overall: 5.9, technical: 5.5, communication: 6.8, confidence: 5.1 },
  { label: 'Apr 17', overall: 6.8, technical: 6.2, communication: 7.4, confidence: 6.5 },
  { label: 'Apr 20', overall: 7.4, technical: 8.1, communication: 7.0, confidence: 6.8 },
]

const FOCUS_TIPS = [
  'Record yourself answering one question — count every "I think" and "um"',
  'Practice BLUF: state your answer in the first sentence, then explain',
  'Before every answer, pause 2 seconds and commit to a direct opening line',
]

// Convert a stored session → display format for SessionCard
function toDisplaySession(s) {
  const weaknesses = Object.values(s.scores || {}).flatMap(v => v.weaknesses || [])
  return {
    id:        s.id,
    type:      typeLabel(s.interview_type),
    tag:       typeTag(s.interview_type),
    date:      s.date,
    daysAgo:   timeAgo(s.timestamp),
    duration:  fmtDuration(s.duration),
    overall:   s.overall_score,
    technical: s.technical,
    communication: s.communication,
    confidence: s.confidence,
    topIssue:  weaknesses[0] || 'Review the full report for details',
    color:     typeColor(s.interview_type),
    // Keep full result for "View report"
    _raw:      s,
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = s => s >= 7.5 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
const scoreBg    = s => s >= 7.5 ? 'bg-green-500/10 text-green-400 border-green-500/20' : s >= 6 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function Counter({ value, decimals = 1, delay = 0 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = Date.now() + delay
    const duration = 1000
    const target = parseFloat(value)
    const tick = () => {
      const elapsed = Math.max(0, Date.now() - start)
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) requestAnimationFrame(tick)
    }
    const frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, delay, decimals])
  return <span>{display.toFixed(decimals)}</span>
}

// ─── Mini score bar ────────────────────────────────────────────────────────────
function MiniScoreBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${(value / 10) * 100}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#18181c] border border-white/[0.08] rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-gray-500 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400 capitalize">{p.dataKey}</span>
          <span className="font-bold text-white ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Session card ──────────────────────────────────────────────────────────────
function SessionCard({ session, index, onView }) {
  const delta = index < SESSIONS.length - 1
    ? (session.overall - SESSIONS[index + 1].overall).toFixed(1)
    : null

  return (
    <div className="card-hover group animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-start gap-4">
        {/* Type badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 text-white"
          style={{ background: session.color + '33', border: `1px solid ${session.color}44` }}
        >
          <span style={{ color: session.color }}>{session.tag}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-[15px]">{session.type}</p>
            {delta !== null && (
              <span className={clsx(
                'text-xs font-semibold flex items-center gap-0.5',
                parseFloat(delta) > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {parseFloat(delta) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {parseFloat(delta) > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-2 mb-3">
            <Clock className="w-3 h-3" />
            {session.daysAgo} · {session.duration}
          </p>

          <div className="space-y-1.5">
            <MiniScoreBar label="Technical" value={session.technical} color="#6366f1" />
            <MiniScoreBar label="Communication" value={session.communication} color="#8b5cf6" />
            <MiniScoreBar label="Confidence" value={session.confidence} color="#a78bfa" />
          </div>

          <p className="text-xs text-gray-600 mt-3 flex items-start gap-1.5">
            <span className="text-yellow-500 shrink-0">→</span>
            {session.topIssue}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className={clsx('badge border text-lg font-black px-3 py-1.5', scoreBg(session.overall))}>
            {session.overall}
          </div>
          <button
            onClick={() => onView(session)}
            className="text-xs text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-1 group-hover:text-indigo-400"
          >
            View report <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [activeLines, setActiveLines] = useState(['overall'])
  const userName = localStorage.getItem('ic_name') || 'there'

  // Load real sessions from localStorage, fall back to mock data
  const rawSessions  = getSessions()
  const hasReal      = rawSessions.length > 0
  const SESSIONS     = hasReal ? rawSessions.map(toDisplaySession) : MOCK_SESSIONS
  const TREND_DATA   = hasReal
    ? [...rawSessions].reverse().map(s => ({
        label:         s.date,
        overall:       +s.overall_score.toFixed(1),
        technical:     +s.technical.toFixed(1),
        communication: +s.communication.toFixed(1),
        confidence:    +s.confidence.toFixed(1),
      }))
    : MOCK_TREND

  const avgScore  = (SESSIONS.reduce((s, x) => s + x.overall, 0) / SESSIONS.length).toFixed(1)
  const bestScore = Math.max(...SESSIONS.map(s => s.overall))
  const confidenceAvg = (SESSIONS.reduce((s, x) => s + x.confidence, 0) / SESSIONS.length).toFixed(1)
  const confImprovement = SESSIONS.length > 1
    ? ((SESSIONS[0].confidence - SESSIONS[SESSIONS.length - 1].confidence) / SESSIONS[SESSIONS.length - 1].confidence * 100).toFixed(0)
    : '0'

  const LINES = [
    { key: 'overall',       color: '#6366f1', label: 'Overall' },
    { key: 'technical',     color: '#22c55e', label: 'Technical' },
    { key: 'communication', color: '#f59e0b', label: 'Communication' },
    { key: 'confidence',    color: '#ec4899', label: 'Confidence' },
  ]

  const handleViewSession = (session) => {
    if (session._raw) {
      // Real session — pass the full stored result
      navigate('/results', { state: { result: session._raw } })
    } else {
      // Mock session fallback
      navigate('/results', {
        state: {
          result: {
            overall_score: session.overall,
            interview_type: session.type.toLowerCase().replace(/ /g, '-'),
            duration: 250,
            summary: `Session from ${session.date}. Top issue: ${session.topIssue}`,
            scores: {
              technical:     { score: session.technical,     summary: '', strengths: [], weaknesses: [session.topIssue], moments: [] },
              communication: { score: session.communication, summary: '', strengths: [], weaknesses: [], moments: [] },
              confidence:    { score: session.confidence,    summary: '', strengths: [], weaknesses: [], moments: [] },
            },
            filler_words: [],
            action_plan: [session.topIssue],
            transcript: [],
          }
        }
      })
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#09090b]">
        <Nav />

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

          {/* Welcome + streak */}
          <div className="flex items-start justify-between animate-fade-up">
            <div>
              <h1 className="text-3xl font-black mb-1">
                {getGreeting()}, {userName} <span className="text-2xl">👋</span>
              </h1>
              <p className="text-gray-500">
                {SESSIONS.length} sessions completed · Last session {SESSIONS[0].daysAgo}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl">
              <Flame className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm font-bold text-orange-300">3-day streak</p>
                <p className="text-xs text-orange-500">Keep it going</p>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Best Score',
                value: bestScore, decimals: 1,
                sub: 'Technical SWE · Apr 20',
                icon: Zap, iconColor: 'text-indigo-400', iconBg: 'bg-indigo-400/10',
                delay: 0,
              },
              {
                label: 'Avg Score',
                value: avgScore, decimals: 1,
                sub: 'Across all sessions',
                icon: BarChart2, iconColor: 'text-purple-400', iconBg: 'bg-purple-400/10',
                delay: 60,
              },
              {
                label: 'Confidence',
                value: confidenceAvg, decimals: 1,
                sub: `+${confImprovement}% from first session`,
                icon: Mic, iconColor: 'text-pink-400', iconBg: 'bg-pink-400/10',
                delay: 120,
              },
              {
                label: 'Sessions',
                value: SESSIONS.length, decimals: 0,
                sub: 'This month',
                icon: CheckCircle, iconColor: 'text-green-400', iconBg: 'bg-green-400/10',
                delay: 180,
              },
            ].map(({ label, value, decimals, sub, icon: Icon, iconColor, iconBg, delay }) => (
              <div
                key={label}
                className="stat-card animate-fade-up"
                style={{ animationDelay: `${delay}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
                  <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', iconBg)}>
                    <Icon className={clsx('w-4 h-4', iconColor)} />
                  </div>
                </div>
                <p className="text-3xl font-black text-white">
                  <Counter value={value} decimals={decimals} delay={delay} />
                  <span className="text-lg text-gray-600 font-semibold">/10</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Chart + Focus area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up stagger-2">
            {/* Trend chart */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-[15px]">Score Trend</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Overall up <span className="text-green-400 font-semibold">+1.5</span> over 3 sessions
                  </p>
                </div>
                <div className="flex gap-2">
                  {LINES.map(l => (
                    <button
                      key={l.key}
                      onClick={() => setActiveLines(prev =>
                        prev.includes(l.key)
                          ? prev.length > 1 ? prev.filter(k => k !== l.key) : prev
                          : [...prev, l.key]
                      )}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-lg font-medium transition-all border',
                        activeLines.includes(l.key)
                          ? 'text-white border-transparent'
                          : 'text-gray-600 border-white/[0.05] hover:text-gray-400'
                      )}
                      style={activeLines.includes(l.key) ? { background: l.color + '33', borderColor: l.color + '44', color: l.color } : {}}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={TREND_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    {LINES.map(l => (
                      <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={l.color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={l.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[4, 10]} tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  {LINES.filter(l => activeLines.includes(l.key)).map(l => (
                    <Area
                      key={l.key}
                      type="monotone"
                      dataKey={l.key}
                      stroke={l.color}
                      strokeWidth={2.5}
                      fill={`url(#grad-${l.key})`}
                      dot={{ fill: l.color, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: l.color, strokeWidth: 2, stroke: '#09090b' }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Focus area */}
            <div className="card border-pink-500/10 bg-pink-500/5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-pink-500/15 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">Focus This Week</p>
                  <p className="text-xs text-pink-400">Confidence · avg {confidenceAvg}/10</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Your confidence score is holding back your overall performance.
                You're using hedging language in moments where you're actually correct.
              </p>

              <div className="space-y-2 flex-1">
                {FOCUS_TIPS.map((tip, i) => (
                  <div key={i} className="flex gap-2 text-xs text-gray-400">
                    <span className="text-pink-500 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/interview?mode=live')}
                className="mt-4 w-full bg-pink-600/20 hover:bg-pink-600/30 border border-pink-600/20 text-pink-300 text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Practice Confidence
              </button>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="animate-fade-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Recent Sessions</h2>
              <button
                onClick={() => navigate('/interview?mode=live')}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                New session <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {SESSIONS.map((s, i) => (
                <SessionCard key={s.id} session={s} index={i} onView={handleViewSession} />
              ))}
            </div>
          </div>

          {/* CTA banner */}
          <div className="animate-fade-up stagger-4 card border-indigo-600/20 bg-indigo-600/5 glow-indigo flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div>
              <h3 className="font-bold text-lg mb-1">Ready to push that score to 8+?</h3>
              <p className="text-gray-400 text-sm">Your technical depth is strong. The gap is confidence. One session could change that.</p>
            </div>
            <button
              onClick={() => navigate('/interview?mode=live')}
              className="btn-primary flex items-center gap-2 whitespace-nowrap text-base py-3.5 px-6"
            >
              <Mic className="w-5 h-5" />
              Start Interview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
