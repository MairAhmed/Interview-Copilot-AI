import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, PhoneOff, Brain, ChevronLeft,
  Volume2, VolumeX, RotateCcw, CheckCircle
} from 'lucide-react'
import clsx from 'clsx'

const MAX_EXCHANGES = 5

// ─── Animated Avatar ───────────────────────────────────────────────────────────
function AlexAvatar({ phase }) {
  const ringColor = {
    speaking:  'border-indigo-500',
    listening: 'border-green-500',
    thinking:  'border-yellow-500',
    done:      'border-purple-500',
    idle:      'border-white/10',
  }[phase] || 'border-white/10'

  const faceColor = {
    speaking:  'from-indigo-600/30 to-indigo-900/60',
    listening: 'from-green-600/20 to-green-900/50',
    thinking:  'from-yellow-600/20 to-yellow-900/50',
    done:      'from-purple-600/20 to-purple-900/50',
    idle:      'from-white/5 to-white/[0.02]',
  }[phase] || 'from-white/5 to-white/[0.02]'

  const iconColor = {
    speaking:  'text-indigo-300',
    listening: 'text-green-300',
    thinking:  'text-yellow-300',
    done:      'text-purple-300',
    idle:      'text-gray-600',
  }[phase] || 'text-gray-600'

  return (
    <div className="relative w-52 h-52 flex items-center justify-center">
      {/* Outer pulse rings */}
      {phase === 'speaking' && (
        <>
          <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-3 rounded-full border border-indigo-500/15 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
          <div className="absolute inset-6 rounded-full border border-indigo-500/10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.6s' }} />
        </>
      )}
      {phase === 'listening' && (
        <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-pulse" />
      )}
      {phase === 'thinking' && (
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-500/30"
          style={{ animation: 'spin 3s linear infinite' }}
        />
      )}

      {/* Main face circle */}
      <div className={clsx(
        'relative w-40 h-40 rounded-full bg-gradient-to-br flex items-center justify-center',
        'border-2 transition-all duration-700 shadow-2xl',
        faceColor, ringColor
      )}>
        {/* Inner glow */}
        <div className={clsx(
          'absolute inset-0 rounded-full opacity-30 blur-xl',
          phase === 'speaking' ? 'bg-indigo-500' :
          phase === 'listening' ? 'bg-green-500' :
          phase === 'thinking' ? 'bg-yellow-500' :
          phase === 'done' ? 'bg-purple-500' : 'bg-transparent'
        )} />

        {/* Face elements */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          {/* Eyes */}
          <div className="flex gap-4">
            <div className={clsx(
              'w-2.5 h-2.5 rounded-full transition-colors duration-500',
              phase === 'speaking' ? 'bg-indigo-300' :
              phase === 'listening' ? 'bg-green-300 animate-pulse' :
              phase === 'thinking' ? 'bg-yellow-300' :
              phase === 'done' ? 'bg-purple-300' : 'bg-gray-600'
            )} />
            <div className={clsx(
              'w-2.5 h-2.5 rounded-full transition-colors duration-500',
              phase === 'speaking' ? 'bg-indigo-300' :
              phase === 'listening' ? 'bg-green-300 animate-pulse' :
              phase === 'thinking' ? 'bg-yellow-300' :
              phase === 'done' ? 'bg-purple-300' : 'bg-gray-600'
            )} />
          </div>

          {/* Mouth — animated when speaking */}
          {phase === 'speaking' ? (
            <div className="flex items-end gap-0.5 h-4">
              {[3, 5, 7, 5, 3, 6, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-indigo-400 rounded-full"
                  style={{
                    height: `${h}px`,
                    animation: `soundBar 0.5s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className={clsx(
              'w-8 h-1 rounded-full transition-colors duration-500',
              phase === 'listening' ? 'bg-green-400' :
              phase === 'thinking' ? 'bg-yellow-400/50' :
              phase === 'done' ? 'bg-purple-400' : 'bg-gray-700'
            )} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sound bar keyframes (injected once) ──────────────────────────────────────
const styleTag = document.createElement('style')
styleTag.textContent = `
  @keyframes soundBar {
    from { transform: scaleY(0.3); }
    to   { transform: scaleY(1.5); }
  }
`
if (!document.head.querySelector('[data-ai-interview-style]')) {
  styleTag.setAttribute('data-ai-interview-style', '1')
  document.head.appendChild(styleTag)
}

// ─── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ phase }) {
  const config = {
    speaking:  { text: 'Alex is speaking…',       cls: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/20' },
    listening: { text: 'Your turn — speak now',   cls: 'bg-green-600/20  text-green-300  border-green-500/20' },
    thinking:  { text: 'Thinking…',               cls: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/20' },
    done:      { text: 'Interview complete',       cls: 'bg-purple-600/20 text-purple-300 border-purple-500/20' },
    idle:      { text: 'Starting…',               cls: 'bg-white/[0.04]  text-gray-500   border-white/[0.06]' },
  }[phase] || { text: '…', cls: 'bg-white/[0.04] text-gray-500 border-white/[0.06]' }

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className={clsx('inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border', config.cls)}
      >
        {phase === 'listening' && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
        {phase === 'speaking'  && <Volume2 className="w-3.5 h-3.5" />}
        {config.text}
      </motion.span>
    </AnimatePresence>
  )
}

const INTERVIEW_TYPES = [
  { key: 'data-science',   label: 'Data Science',         emoji: '📊' },
  { key: 'technical-swe',  label: 'Software Engineering', emoji: '💻' },
  { key: 'behavioral',     label: 'Behavioral',           emoji: '🧠' },
  { key: 'product',        label: 'Product Management',   emoji: '🗂️' },
  { key: 'leadership',     label: 'Leadership',           emoji: '🎯' },
  { key: 'finance',        label: 'Finance',              emoji: '📈' },
]

// ─── Setup screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [selected,    setSelected]    = useState('data-science')
  const [resumeFile,  setResumeFile]  = useState(null)
  const [resumeText,  setResumeText]  = useState('')
  const [resumeState, setResumeState] = useState('idle') // idle | loading | done | error

  const handleResumeFile = async (file) => {
    if (!file) return
    setResumeFile(file)
    setResumeState('loading')
    try {
      const fd = new FormData()
      fd.append('file', file, file.name)
      fd.append('interview_type', selected)
      // Reuse the existing generate-questions endpoint to extract text
      // but we only need the raw text — use a lighter dedicated parse endpoint
      // Fallback: read as text directly in browser for .txt files
      if (file.name.toLowerCase().endsWith('.pdf')) {
        // Send to backend to extract PDF text
        const res = await fetch('/api/parse-resume', {
          method: 'POST',
          body: fd,
        })
        if (!res.ok) throw new Error('parse_failed')
        const data = await res.json()
        setResumeText(data.text)
      } else {
        // Plain text — read directly
        const text = await file.text()
        setResumeText(text)
      }
      setResumeState('done')
    } catch {
      setResumeState('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-6 animate-fade-up">
        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center">
            <span className="text-3xl">🤖</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black">Meet Alex</h1>
            <p className="text-gray-500 text-sm mt-1">Your AI interviewer. Pick a type, upload your resume, and Alex will tailor every question to your background.</p>
          </div>
        </div>

        {/* Type selector */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Interview Type</p>
          <div className="grid grid-cols-2 gap-2">
            {INTERVIEW_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setSelected(t.key)}
                className={clsx(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                  selected === t.key
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:border-white/[0.12] hover:text-gray-300'
                )}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="text-sm font-semibold leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resume upload */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">
            Resume <span className="normal-case tracking-normal text-gray-600 font-normal">(optional — Alex will tailor questions to you)</span>
          </p>
          {!resumeFile ? (
            <label className="cursor-pointer">
              <div className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/[0.08] hover:border-indigo-500/30 hover:bg-indigo-600/5 transition-all text-gray-500 hover:text-gray-300">
                <span className="text-xl">📄</span>
                <div>
                  <p className="text-sm font-medium">Upload resume / CV</p>
                  <p className="text-xs text-gray-600 mt-0.5">PDF or plain text</p>
                </div>
              </div>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={e => handleResumeFile(e.target.files?.[0])}
              />
            </label>
          ) : (
            <div className={clsx(
              'flex items-center gap-3 p-4 rounded-xl border transition-all',
              resumeState === 'done'    ? 'border-indigo-500/30 bg-indigo-600/5' :
              resumeState === 'error'   ? 'border-red-500/30 bg-red-600/5' :
              'border-white/[0.08] bg-white/[0.02]'
            )}>
              <span className="text-xl shrink-0">
                {resumeState === 'loading' ? '⏳' : resumeState === 'done' ? '✅' : resumeState === 'error' ? '❌' : '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{resumeFile.name}</p>
                <p className="text-xs mt-0.5 text-gray-500">
                  {resumeState === 'loading' ? 'Reading resume…' :
                   resumeState === 'done'    ? `Ready — Alex will personalise your interview` :
                   resumeState === 'error'   ? 'Could not read file — Alex will use generic questions' :
                   ''}
                </p>
              </div>
              <button
                onClick={() => { setResumeFile(null); setResumeText(''); setResumeState('idle') }}
                className="text-gray-600 hover:text-gray-300 transition-colors shrink-0"
              >✕</button>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400">Before you start</p>
          <ul className="space-y-1.5 text-xs text-gray-600">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Use Chrome for best mic support</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Allow microphone access when prompted</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Speak naturally — Alex listens automatically</li>
          </ul>
        </div>

        <button
          onClick={() => onStart(selected, resumeText)}
          disabled={resumeState === 'loading'}
          className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Mic className="w-5 h-5" />
          {resumeText ? 'Start Personalised Interview' : 'Start Interview with Alex'}
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AIInterviewer() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [selectedType, setSelectedType]  = useState(null)  // null = show setup screen
  const [resumeText,   setResumeText]    = useState('')
  const interviewType = selectedType || searchParams.get('type') || 'general'

  const [phase, setPhase]               = useState('idle')
  const [messages, setMessages]         = useState([])
  const [liveText, setLiveText]         = useState('')
  const [interimText, setInterimText]   = useState('')
  const [exchangeCount, setExchangeCount] = useState(0)
  const [error, setError]               = useState('')
  const [muted, setMuted]               = useState(false)

  const audioRef       = useRef(null)   // current playing Audio object
  const recognitionRef = useRef(null)
  const userAnswerRef  = useRef('')     // stable ref for final answer text
  const messagesEndRef = useRef(null)
  const phaseRef       = useRef('idle') // stable ref so callbacks see current phase
  const startedRef     = useRef(false)  // guard against React StrictMode double-fire

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase }, [phase])

  // Auto-scroll transcript
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Kick off once user picks a type — guard prevents React StrictMode double-fire
  useEffect(() => {
    if (!selectedType) return
    if (startedRef.current) return
    startedRef.current = true
    startConversation([])
    return () => {
      audioRef.current?.pause()
      window.speechSynthesis.cancel()
      recognitionRef.current?.abort()
    }
  }, [selectedType])

  // ── Speak a line via ElevenLabs ─────────────────────────────────────────────
  const speak = useCallback(async (text, onDone) => {
    setPhase('speaking')
    phaseRef.current = 'speaking'
    setLiveText(text)

    // Always kill browser TTS immediately — prevents double voice
    window.speechSynthesis.cancel()

    // Stop any currently playing ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (muted) {
      setTimeout(() => { onDone?.() }, 1500)
      return
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) throw new Error('tts_unavailable')

      const blob  = await res.blob()
      const url   = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      // Kill browser TTS again after async fetch (belt-and-suspenders)
      window.speechSynthesis.cancel()

      audio.onended = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
        onDone?.()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
        onDone?.()
      }

      try {
        await audio.play()
      } catch {
        // Autoplay blocked — still call onDone so conversation continues
        onDone?.()
      }

    } catch {
      // ElevenLabs unavailable — browser TTS only fallback
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US')
      if (preferred) utter.voice = preferred
      utter.rate = 0.92
      utter.onend  = () => onDone?.()
      utter.onerror = () => onDone?.()
      window.speechSynthesis.speak(utter)
    }
  }, [muted])

  // ── Start listening ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition not supported in this browser. Try Chrome.')
      return
    }
    setPhase('listening')
    phaseRef.current = 'listening'
    setInterimText('')
    userAnswerRef.current = ''

    const rec = new SR()
    rec.continuous      = true
    rec.interimResults  = true
    rec.lang            = 'en-US'
    recognitionRef.current = rec

    let silenceTimer = null

    rec.onresult = (e) => {
      let final = '', interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (final) {
        userAnswerRef.current += ' ' + final
        setInterimText('')
      } else {
        setInterimText(interim)
      }

      // Reset silence timer on every speech event
      clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => {
        if (phaseRef.current === 'listening' && userAnswerRef.current.trim()) {
          rec.stop()
        }
      }, 2500)
    }

    rec.onend = () => {
      clearTimeout(silenceTimer)
      const answer = userAnswerRef.current.trim()
      if (answer && phaseRef.current === 'listening') {
        handleUserAnswer(answer)
      } else if (phaseRef.current === 'listening') {
        // Nothing captured — restart listening
        setTimeout(startListening, 500)
      }
    }

    rec.onerror = (e) => {
      if (e.error !== 'no-speech') setError(`Mic error: ${e.error}`)
      clearTimeout(silenceTimer)
    }

    rec.start()
  }, [])

  // ── Send user answer → get Alex's response ─────────────────────────────────
  const handleUserAnswer = useCallback(async (text) => {
    setPhase('thinking')
    phaseRef.current = 'thinking'
    setInterimText('')

    setMessages(prev => {
      const next = [...prev, { role: 'user', text }]
      fetchAlexResponse(next)
      return next
    })
  }, [])

  // ── Fetch Alex's next line from Claude ─────────────────────────────────────
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
        }),
      })
      const text = await res.text()

      setMessages(prev => [...prev, { role: 'interviewer', text }])
      setExchangeCount(c => c + 1)

      const isLastExchange = history.filter(m => m.role === 'user').length >= MAX_EXCHANGES - 1
      const isClosing = text.toLowerCase().includes("concludes") ||
                        text.toLowerCase().includes("in touch") ||
                        text.toLowerCase().includes("that's all")

      if (isLastExchange || isClosing) {
        speak(text, () => setPhase('done'))
      } else {
        speak(text, () => setTimeout(startListening, 600))
      }
    } catch (e) {
      setError('Connection error — check backend is running.')
      setPhase('idle')
    }
  }, [interviewType, speak, startListening])

  // ── Initial greeting ────────────────────────────────────────────────────────
  const startConversation = useCallback(async (history) => {
    setPhase('thinking')
    phaseRef.current = 'thinking'
    setMessages([])
    setExchangeCount(0)
    setError('')
    try {
      const res = await fetch('/api/ai-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], interview_type: interviewType, exchange_count: 0 }),
      })
      const text = await res.text()
      setMessages([{ role: 'interviewer', text }])
      speak(text, () => setTimeout(startListening, 600))
    } catch (e) {
      setError('Could not reach backend. Make sure uvicorn is running on port 8000.')
      setPhase('idle')
    }
  }, [interviewType, speak, startListening])

  const handleEndCall = () => {
    audioRef.current?.pause()
    window.speechSynthesis.cancel()
    recognitionRef.current?.abort()
    navigate(-1)
  }

  const handleRestart = () => {
    audioRef.current?.pause()
    window.speechSynthesis.cancel()
    recognitionRef.current?.abort()
    startConversation([])
  }

  // Show setup screen until user picks a type
  if (!selectedType) {
    return (
      <SetupScreen
        onStart={(type, resume) => {
          setResumeText(resume || '')
          setSelectedType(type)
          startedRef.current = false  // allow the effect to fire
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <button
          onClick={handleEndCall}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex items-center gap-2">
          {phase !== 'done' && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="text-sm font-bold text-white">AI Interviewer</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(m => !m)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition-colors"
            title={muted ? 'Unmute Alex' : 'Mute Alex'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full px-6 py-8 gap-8">

        {/* LEFT — Avatar + controls */}
        <div className="flex flex-col items-center justify-center flex-1 gap-5">

          <AlexAvatar phase={phase} />

          <div className="text-center">
            <p className="font-bold text-lg tracking-tight">Alex</p>
            <p className="text-xs text-gray-500 mt-0.5">AI Interviewer · {interviewType}</p>
          </div>

          <StatusPill phase={phase} />

          {/* Current speech bubble */}
          <AnimatePresence>
            {phase === 'speaking' && liveText && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-xs text-center"
              >
                <p className="text-sm text-gray-400 italic leading-relaxed">"{liveText}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User live transcript */}
          <AnimatePresence>
            {phase === 'listening' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-xs bg-green-600/5 border border-green-500/20 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[11px] text-green-400 font-semibold uppercase tracking-wider">Listening</span>
                </div>
                <p className="text-sm text-gray-300 min-h-[20px] leading-relaxed">
                  {interimText || (userAnswerRef.current.trim() ? userAnswerRef.current.trim() : 'Speak your answer…')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="max-w-xs bg-red-900/20 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 mt-2">
            {phase === 'done' ? (
              <>
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-sm text-gray-300 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Restart
                </button>
                <button
                  onClick={handleEndCall}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Done
                </button>
              </>
            ) : (
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 text-sm font-semibold transition-colors"
              >
                <PhoneOff className="w-4 h-4" /> End Interview
              </button>
            )}
          </div>

          {/* Exchange counter */}
          {phase !== 'done' && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: MAX_EXCHANGES }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    i < exchangeCount ? 'bg-indigo-500' : 'bg-white/[0.08]'
                  )}
                />
              ))}
              <span className="text-[11px] text-gray-600 ml-1">{exchangeCount}/{MAX_EXCHANGES}</span>
            </div>
          )}
        </div>

        {/* RIGHT — Transcript */}
        <div className="lg:w-80 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transcript</h3>
            {messages.length > 0 && (
              <span className="text-[10px] text-gray-600">{messages.length} messages</span>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs text-gray-700">Conversation will appear here…</p>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx('flex gap-2', m.role === 'user' && 'flex-row-reverse')}
              >
                <div className={clsx(
                  'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'interviewer'
                    ? 'bg-white/[0.04] text-gray-300 rounded-tl-sm'
                    : 'bg-indigo-600/20 text-indigo-200 rounded-tr-sm'
                )}>
                  <p className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider mb-1',
                    m.role === 'interviewer' ? 'text-gray-600' : 'text-indigo-500 text-right'
                  )}>
                    {m.role === 'interviewer' ? 'Alex' : 'You'}
                  </p>
                  {m.text}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
