import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import {
  Mic, PhoneOff, ChevronLeft, Volume2, VolumeX,
  RotateCcw, CheckCircle, Code2, Send, Play
} from 'lucide-react'
import clsx from 'clsx'

const MAX_EXCHANGES = 6

const INTERVIEW_TYPES = [
  { key: 'data-science',  label: 'Data Science',        emoji: '📊' },
  { key: 'technical-swe', label: 'Software Engineering', emoji: '💻' },
  { key: 'behavioral',    label: 'Behavioral',           emoji: '🧠' },
  { key: 'product',       label: 'Product Management',   emoji: '🗂️' },
  { key: 'leadership',    label: 'Leadership',           emoji: '🎯' },
  { key: 'finance',       label: 'Finance',              emoji: '📈' },
]

const CODING_TYPES = new Set(['technical-swe', 'data-science'])

const LANGUAGES = [
  { key: 'python',     label: 'Python' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'java',       label: 'Java' },
  { key: 'cpp',        label: 'C++' },
  { key: 'sql',        label: 'SQL' },
]

const DEFAULT_SNIPPETS = {
  python:     '# Write your solution here\ndef solution():\n    pass\n',
  javascript: '// Write your solution here\nfunction solution() {\n\n}\n',
  java:       '// Write your solution here\nclass Solution {\n    public void solve() {\n        \n    }\n}\n',
  cpp:        '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    \n}\n',
  sql:        '-- Write your query here\nSELECT *\nFROM table_name\nWHERE condition;\n',
}

// ─── Inject sound bar animation ────────────────────────────────────────────────
if (!document.head.querySelector('[data-ai-interview-style]')) {
  const s = document.createElement('style')
  s.setAttribute('data-ai-interview-style', '1')
  s.textContent = `@keyframes soundBar { from{transform:scaleY(0.3)} to{transform:scaleY(1.5)} }`
  document.head.appendChild(s)
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function AlexAvatar({ phase, small = false }) {
  const size   = small ? 'w-28 h-28' : 'w-44 h-44'
  const inner  = small ? 'w-20 h-20' : 'w-32 h-32'
  const eyeSz  = small ? 'w-2 h-2' : 'w-2.5 h-2.5'
  const barCnt = small ? 5 : 7

  const ringCls = {
    speaking:  'border-indigo-500',
    listening: 'border-green-500',
    thinking:  'border-yellow-500',
    done:      'border-purple-500',
    idle:      'border-white/10',
  }[phase] || 'border-white/10'

  const faceCls = {
    speaking:  'from-indigo-600/30 to-indigo-900/60',
    listening: 'from-green-600/20 to-green-900/50',
    thinking:  'from-yellow-600/20 to-yellow-900/50',
    done:      'from-purple-600/20 to-purple-900/50',
    idle:      'from-white/5 to-white/[0.02]',
  }[phase] || 'from-white/5 to-white/[0.02]'

  const eyeCls = {
    speaking:  'bg-indigo-300',
    listening: 'bg-green-300 animate-pulse',
    thinking:  'bg-yellow-300',
    done:      'bg-purple-300',
    idle:      'bg-gray-600',
  }[phase] || 'bg-gray-600'

  return (
    <div className={clsx('relative flex items-center justify-center', size)}>
      {phase === 'speaking' && <>
        <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-3 rounded-full border border-indigo-500/15 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
      </>}
      {phase === 'listening' && <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-pulse" />}
      {phase === 'thinking'  && <div className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-500/30" style={{ animation: 'spin 3s linear infinite' }} />}

      <div className={clsx('relative rounded-full bg-gradient-to-br flex items-center justify-center border-2 transition-all duration-700 shadow-2xl', inner, faceCls, ringCls)}>
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="flex gap-3">
            <div className={clsx('rounded-full transition-colors duration-500', eyeSz, eyeCls)} />
            <div className={clsx('rounded-full transition-colors duration-500', eyeSz, eyeCls)} />
          </div>
          {phase === 'speaking' ? (
            <div className="flex items-end gap-0.5 h-3">
              {Array.from({ length: barCnt }).map((_, i) => (
                <div key={i} className="w-1 bg-indigo-400 rounded-full"
                  style={{ height: `${[3,5,7,5,3,6,4][i] || 4}px`, animation: 'soundBar 0.5s ease-in-out infinite alternate', animationDelay: `${i * 0.07}s` }} />
              ))}
            </div>
          ) : (
            <div className={clsx('w-6 h-0.5 rounded-full transition-colors duration-500',
              phase === 'listening' ? 'bg-green-400' : phase === 'thinking' ? 'bg-yellow-400/50' : phase === 'done' ? 'bg-purple-400' : 'bg-gray-700'
            )} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ phase }) {
  const cfg = {
    speaking:  { text: 'Alex is speaking…',      cls: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/20' },
    listening: { text: 'Your turn — speak now',  cls: 'bg-green-600/20  text-green-300  border-green-500/20' },
    thinking:  { text: 'Thinking…',              cls: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/20' },
    done:      { text: 'Interview complete',      cls: 'bg-purple-600/20 text-purple-300 border-purple-500/20' },
    idle:      { text: 'Starting…',              cls: 'bg-white/[0.04]  text-gray-500   border-white/[0.06]' },
  }[phase] || { text: '…', cls: 'bg-white/[0.04] text-gray-500 border-white/[0.06]' }

  return (
    <AnimatePresence mode="wait">
      <motion.span key={phase} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
        className={clsx('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border', cfg.cls)}>
        {phase === 'listening' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
        {phase === 'speaking'  && <Volume2 className="w-3 h-3" />}
        {cfg.text}
      </motion.span>
    </AnimatePresence>
  )
}

// ─── Setup screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [selected,    setSelected]    = useState('technical-swe')
  const [resumeFile,  setResumeFile]  = useState(null)
  const [resumeText,  setResumeText]  = useState('')
  const [resumeState, setResumeState] = useState('idle')
  const [jobDesc,     setJobDesc]     = useState('')
  const [showJD,      setShowJD]      = useState(false)

  const handleResumeFile = async (file) => {
    if (!file) return
    setResumeFile(file)
    setResumeState('loading')
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const fd = new FormData()
        fd.append('file', file, file.name)
        const res = await fetch('/api/parse-resume', { method: 'POST', body: fd })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setResumeText(data.text)
      } else {
        setResumeText(await file.text())
      }
      setResumeState('done')
    } catch {
      setResumeState('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg space-y-6 animate-fade-up">

        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center">
            <span className="text-3xl">🤖</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black">Interview with Alex</h1>
            <p className="text-gray-500 text-sm mt-1">Upload your resume and the job description — Alex will tailor every question to the role you're applying for.</p>
          </div>
        </div>

        {/* Interview type */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Interview Type</p>
          <div className="grid grid-cols-3 gap-2">
            {INTERVIEW_TYPES.map(t => (
              <button key={t.key} onClick={() => setSelected(t.key)}
                className={clsx('flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                  selected === t.key
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:border-white/[0.12] hover:text-gray-300'
                )}>
                <span className="text-lg">{t.emoji}</span>
                <span className="text-xs font-semibold leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
          {CODING_TYPES.has(selected) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-indigo-400 bg-indigo-600/10 border border-indigo-500/20 rounded-xl px-3 py-2">
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              Live coding screen included — code while you talk to Alex
            </div>
          )}
        </div>

        {/* Two-column: Resume + JD */}
        <div className="grid grid-cols-2 gap-4">
          {/* Resume */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Your Resume</p>
            {!resumeFile ? (
              <label className="cursor-pointer block">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-white/[0.08] hover:border-indigo-500/30 hover:bg-indigo-600/5 transition-all text-gray-500 hover:text-gray-300 text-center">
                  <span className="text-2xl">📄</span>
                  <p className="text-xs font-medium">Upload CV</p>
                  <p className="text-[10px] text-gray-600">PDF or text</p>
                </div>
                <input type="file" accept=".pdf,.txt" className="hidden" onChange={e => handleResumeFile(e.target.files?.[0])} />
              </label>
            ) : (
              <div className={clsx('flex items-start gap-2 p-3 rounded-xl border text-xs transition-all',
                resumeState === 'done' ? 'border-indigo-500/30 bg-indigo-600/5' :
                resumeState === 'error' ? 'border-red-500/30 bg-red-600/5' : 'border-white/[0.08]'
              )}>
                <span>{resumeState === 'loading' ? '⏳' : resumeState === 'done' ? '✅' : '❌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{resumeFile.name}</p>
                  <p className="text-gray-600 mt-0.5">
                    {resumeState === 'loading' ? 'Reading…' : resumeState === 'done' ? 'Ready' : 'Failed'}
                  </p>
                </div>
                <button onClick={() => { setResumeFile(null); setResumeText(''); setResumeState('idle') }}
                  className="text-gray-600 hover:text-gray-300">✕</button>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Job Description</p>
            {!showJD ? (
              <button onClick={() => setShowJD(true)}
                className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-white/[0.08] hover:border-indigo-500/30 hover:bg-indigo-600/5 transition-all text-gray-500 hover:text-gray-300 text-center">
                <span className="text-2xl">📋</span>
                <p className="text-xs font-medium">Paste JD</p>
                <p className="text-[10px] text-gray-600">Optional</p>
              </button>
            ) : (
              <textarea
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste the job description here…"
                className="w-full h-28 bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/40 rounded-xl px-3 py-2.5 text-xs text-gray-300 placeholder-gray-600 resize-none outline-none transition-colors"
              />
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Use Chrome</li>
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Allow mic access</li>
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Speak naturally — Alex listens automatically</li>
            {CODING_TYPES.has(selected) && <li className="flex items-center gap-1.5"><span className="text-indigo-400">✓</span> Code in the editor, then hit Share Code to show Alex</li>}
          </ul>
        </div>

        <button
          onClick={() => onStart(selected, resumeText, jobDesc)}
          disabled={resumeState === 'loading'}
          className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Mic className="w-5 h-5" />
          {resumeText || jobDesc ? 'Start Personalised Interview' : 'Start Interview with Alex'}
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AIInterviewer() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [selectedType,   setSelectedType]   = useState(null)
  const [resumeText,     setResumeText]      = useState('')
  const [jobDescription, setJobDescription]  = useState('')
  const interviewType = selectedType || searchParams.get('type') || 'general'
  const isCoding      = CODING_TYPES.has(interviewType)

  const [phase,        setPhase]        = useState('idle')
  const [messages,     setMessages]     = useState([])
  const [liveText,     setLiveText]     = useState('')
  const [interimText,  setInterimText]  = useState('')
  const [exchangeCount,setExchangeCount]= useState(0)
  const [error,        setError]        = useState('')
  const [muted,        setMuted]        = useState(false)

  // Coding panel state
  const [code,         setCode]         = useState('')
  const [language,     setLanguage]     = useState('python')
  const [showEditor,   setShowEditor]   = useState(true)
  const [codeShared,   setCodeShared]   = useState(false)

  const audioRef       = useRef(null)
  const recognitionRef = useRef(null)
  const userAnswerRef  = useRef('')
  const messagesEndRef = useRef(null)
  const phaseRef       = useRef('idle')
  const startedRef     = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Set default code snippet when language changes
  useEffect(() => { setCode(DEFAULT_SNIPPETS[language] || '') }, [language])
  // Default language by type
  useEffect(() => {
    if (interviewType === 'data-science') setLanguage('python')
    else if (interviewType === 'technical-swe') setLanguage('javascript')
  }, [interviewType])

  useEffect(() => {
    if (!selectedType) return
    if (startedRef.current) return
    startedRef.current = true
    startConversation()
    return () => {
      audioRef.current?.pause()
      window.speechSynthesis.cancel()
      recognitionRef.current?.abort()
    }
  }, [selectedType])

  // ── TTS via ElevenLabs ──────────────────────────────────────────────────────
  const speak = useCallback(async (text, onDone) => {
    setPhase('speaking')
    phaseRef.current = 'speaking'
    setLiveText(text)
    window.speechSynthesis.cancel()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }

    if (muted) { setTimeout(() => onDone?.(), 1200); return }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error()
      const blob  = await res.blob()
      const url   = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      window.speechSynthesis.cancel()
      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; onDone?.() }
      audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; onDone?.() }
      try { await audio.play() } catch { onDone?.() }
    } catch {
      // Fallback to browser TTS
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      const v = window.speechSynthesis.getVoices().find(v => v.name.includes('Google US English') || v.lang === 'en-US')
      if (v) utter.voice = v
      utter.rate = 0.92
      utter.onend = () => onDone?.()
      utter.onerror = () => onDone?.()
      window.speechSynthesis.speak(utter)
    }
  }, [muted])

  // ── Speech recognition ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Speech recognition not supported. Use Chrome.'); return }
    setPhase('listening'); phaseRef.current = 'listening'
    setInterimText(''); userAnswerRef.current = ''

    const rec = new SR()
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US'
    recognitionRef.current = rec

    let silenceTimer = null
    rec.onresult = (e) => {
      let final = '', interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t; else interim += t
      }
      if (final) { userAnswerRef.current += ' ' + final; setInterimText('') }
      else setInterimText(interim)
      clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => {
        if (phaseRef.current === 'listening' && userAnswerRef.current.trim()) rec.stop()
      }, 2500)
    }
    rec.onend = () => {
      clearTimeout(silenceTimer)
      const answer = userAnswerRef.current.trim()
      if (answer && phaseRef.current === 'listening') handleUserAnswer(answer)
      else if (phaseRef.current === 'listening') setTimeout(startListening, 500)
    }
    rec.onerror = (e) => { if (e.error !== 'no-speech') setError(`Mic error: ${e.error}`); clearTimeout(silenceTimer) }
    rec.start()
  }, [])

  // ── Handle spoken answer ────────────────────────────────────────────────────
  const handleUserAnswer = useCallback((text) => {
    setPhase('thinking'); phaseRef.current = 'thinking'; setInterimText('')
    setMessages(prev => { const next = [...prev, { role: 'user', text }]; fetchAlexResponse(next); return next })
  }, [])

  // ── Share code with Alex ────────────────────────────────────────────────────
  const handleShareCode = useCallback(() => {
    if (!code.trim()) return
    const msg = `[Code submitted — ${LANGUAGES.find(l => l.key === language)?.label || language}]\n\`\`\`${language}\n${code}\n\`\`\``
    setCodeShared(true)
    recognitionRef.current?.stop()
    setPhase('thinking'); phaseRef.current = 'thinking'
    setMessages(prev => { const next = [...prev, { role: 'user', text: msg }]; fetchAlexResponse(next); return next })
  }, [code, language])

  // ── Fetch Alex response ─────────────────────────────────────────────────────
  const fetchAlexResponse = useCallback(async (history) => {
    try {
      const res = await fetch('/api/ai-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          interview_type: interviewType,
          exchange_count: history.filter(m => m.role === 'user').length,
          resume_text: resumeText || '',
          job_description: jobDescription || '',
        }),
      })
      const text = await res.text()
      setMessages(prev => [...prev, { role: 'interviewer', text }])
      setExchangeCount(c => c + 1)
      const isClosing = history.filter(m => m.role === 'user').length >= MAX_EXCHANGES - 1
        || text.toLowerCase().includes('in touch') || text.toLowerCase().includes("that's all")
      if (isClosing) speak(text, () => setPhase('done'))
      else speak(text, () => setTimeout(startListening, 600))
    } catch {
      setError('Connection error — check backend is running.')
      setPhase('idle')
    }
  }, [interviewType, resumeText, jobDescription, speak, startListening])

  // ── Start conversation ──────────────────────────────────────────────────────
  const startConversation = useCallback(async () => {
    setPhase('thinking'); phaseRef.current = 'thinking'
    setMessages([]); setExchangeCount(0); setError(''); setCodeShared(false)
    try {
      const res = await fetch('/api/ai-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [], interview_type: interviewType, exchange_count: 0,
          resume_text: resumeText || '', job_description: jobDescription || '',
        }),
      })
      const text = await res.text()
      setMessages([{ role: 'interviewer', text }])
      speak(text, () => setTimeout(startListening, 600))
    } catch {
      setError('Could not reach backend. Make sure uvicorn is running on port 8000.')
      setPhase('idle')
    }
  }, [interviewType, resumeText, jobDescription, speak, startListening])

  const handleEndCall = () => { audioRef.current?.pause(); window.speechSynthesis.cancel(); recognitionRef.current?.abort(); navigate(-1) }
  const handleRestart = () => { audioRef.current?.pause(); window.speechSynthesis.cancel(); recognitionRef.current?.abort(); startedRef.current = false; startConversation() }

  // Setup screen
  if (!selectedType) {
    return (
      <SetupScreen onStart={(type, resume, jd) => {
        setResumeText(resume || '')
        setJobDescription(jd || '')
        setSelectedType(type)
        startedRef.current = false
      }} />
    )
  }

  return (
    <div className="h-screen bg-[#09090b] flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
        <button onClick={handleEndCall} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex items-center gap-2">
          {phase !== 'done' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-sm font-bold">AI Interviewer</span>
          {jobDescription && <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-full px-2 py-0.5">JD loaded</span>}
          {resumeText    && <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">Resume loaded</span>}
        </div>
        <div className="flex items-center gap-2">
          {isCoding && (
            <button onClick={() => setShowEditor(e => !e)}
              className={clsx('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all',
                showEditor ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.04] border-white/[0.06] text-gray-500 hover:text-gray-300'
              )}>
              <Code2 className="w-3.5 h-3.5" /> {showEditor ? 'Hide Editor' : 'Show Editor'}
            </button>
          )}
          <button onClick={() => setMuted(m => !m)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition-colors">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — Alex panel */}
        <div className={clsx(
          'flex flex-col border-r border-white/[0.06] transition-all duration-300',
          isCoding && showEditor ? 'w-80 shrink-0' : 'flex-1'
        )}>
          {/* Avatar + status */}
          <div className="flex flex-col items-center gap-3 pt-6 pb-4 px-4">
            <AlexAvatar phase={phase} small={isCoding && showEditor} />
            <div className="text-center">
              <p className="font-bold text-sm">Alex</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{INTERVIEW_TYPES.find(t => t.key === interviewType)?.label || interviewType}</p>
            </div>
            <StatusPill phase={phase} />
          </div>

          {/* Current speech */}
          <AnimatePresence>
            {phase === 'speaking' && liveText && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mx-4 mb-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                <p className="text-xs text-gray-400 italic leading-relaxed">"{liveText}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Listening indicator */}
          <AnimatePresence>
            {phase === 'listening' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mx-4 mb-3 p-3 bg-green-600/5 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">Listening</span>
                </div>
                <p className="text-xs text-gray-400 min-h-[16px]">{interimText || userAnswerRef.current.trim() || 'Speak now…'}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-3">
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={clsx('flex', m.role === 'user' && 'flex-row-reverse')}>
                <div className={clsx(
                  'max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                  m.role === 'interviewer' ? 'bg-white/[0.04] text-gray-300 rounded-tl-sm' : 'bg-indigo-600/20 text-indigo-200 rounded-tr-sm'
                )}>
                  <p className={clsx('text-[9px] font-bold uppercase tracking-wider mb-0.5',
                    m.role === 'interviewer' ? 'text-gray-600' : 'text-indigo-500 text-right')}>
                    {m.role === 'interviewer' ? 'Alex' : 'You'}
                  </p>
                  {m.text.startsWith('[Code submitted') ? (
                    <span className="text-indigo-400 italic">📎 Code shared with Alex</span>
                  ) : m.text}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Exchange counter + controls */}
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: MAX_EXCHANGES }).map((_, i) => (
                <div key={i} className={clsx('w-1.5 h-1.5 rounded-full transition-colors', i < exchangeCount ? 'bg-indigo-500' : 'bg-white/[0.08]')} />
              ))}
            </div>
            {phase === 'done' ? (
              <div className="flex gap-2">
                <button onClick={handleRestart} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  <RotateCcw className="w-3 h-3" /> Restart
                </button>
                <button onClick={handleEndCall} className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                  <CheckCircle className="w-3 h-3" /> Done
                </button>
              </div>
            ) : (
              <button onClick={handleEndCall}
                className="flex items-center gap-1 text-xs bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                <PhoneOff className="w-3 h-3" /> End
              </button>
            )}
          </div>

          {error && <p className="px-4 pb-3 text-xs text-red-400">{error}</p>}
        </div>

        {/* RIGHT — Monaco coding panel (technical only) */}
        {isCoding && showEditor && (
          <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-[#3c3c3c] border border-white/[0.08] text-gray-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500/40"
                >
                  {LANGUAGES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600">Talk through your solution as you code</span>
                <button
                  onClick={handleShareCode}
                  disabled={!code.trim() || phase === 'thinking' || phase === 'speaking'}
                  className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Send className="w-3 h-3" /> Share Code with Alex
                </button>
              </div>
            </div>

            {/* Monaco */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={val => setCode(val || '')}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  renderLineHighlight: 'line',
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>

            {/* Code shared confirmation */}
            <AnimatePresence>
              {codeShared && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="px-4 py-2.5 bg-indigo-600/10 border-t border-indigo-500/20 flex items-center gap-2 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs text-indigo-400">Code shared — Alex is reviewing it, keep talking through your solution</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
