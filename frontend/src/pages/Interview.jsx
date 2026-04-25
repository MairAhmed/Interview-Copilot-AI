import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Square, Upload, Brain, ChevronDown, ArrowRight,
  CheckCircle, Sparkles, Monitor, AlertCircle, Play, Info,
  FileText, X, Loader2, Wand2
} from 'lucide-react'
import clsx from 'clsx'
import Nav from '../components/Nav'
import PageTransition from '../components/PageTransition'

const QUESTIONS = {
  general: [
    'Tell me about yourself and your background.',
    'Describe a challenging situation you faced at work and how you overcame it.',
    'Why are you interested in this role and what makes you a strong fit?',
  ],
  'technical-swe': [
    'Explain the difference between a stack and a queue, and give a real-world use case for each.',
    'How does garbage collection work, and how can memory leaks occur despite it?',
    'Walk me through how you would design a URL shortener like bit.ly at scale.',
  ],
  'technical-data': [
    'Explain overfitting and describe three techniques to prevent it.',
    'Walk me through a machine learning project end-to-end, from data to deployment.',
    'How would you handle a dataset where 95% of labels belong to one class?',
  ],
  product: [
    'How do you decide what features to prioritize on a product roadmap?',
    'Tell me about a product you think is poorly designed. How would you fix it?',
    'How would you measure the success of a new onboarding flow?',
  ],
  leadership: [
    'Tell me about a time you led a team through significant uncertainty or change.',
    'How do you handle a situation where two of your direct reports are in conflict?',
    'Describe a decision you made that turned out to be wrong. What did you do?',
  ],
  finance: [
    'Walk me through a discounted cash flow analysis step by step.',
    'Tell me about a recent deal or transaction that caught your attention and why.',
    'How do you evaluate whether a company is a good acquisition target?',
  ],
}

const INTERVIEW_TYPES = [
  { value: 'general',        label: 'General / Behavioral' },
  { value: 'technical-swe',  label: 'Technical — Software Engineering' },
  { value: 'technical-data', label: 'Technical — Data Science' },
  { value: 'product',        label: 'Product Management' },
  { value: 'leadership',     label: 'Leadership / Managerial' },
  { value: 'finance',        label: 'Finance / Consulting' },
]

const AGENT_STEPS = [
  { label: 'Transcribing audio…',            sub: 'Whisper speech-to-text model' },
  { label: 'Technical Agent analyzing…',     sub: 'Evaluating depth & accuracy' },
  { label: 'Communication Agent reviewing…', sub: 'Checking structure & clarity' },
  { label: 'Confidence Agent scanning…',     sub: 'Detecting hedging & filler words' },
  { label: 'Synthesizing final report…',     sub: 'Building your action plan' },
]

const MODES = [
  { key: 'live',    icon: Mic,     label: 'Live Practice',    desc: 'Answer AI questions & record' },
  { key: 'upload',  icon: Upload,  label: 'Upload Recording', desc: 'Zoom, Teams, phone recordings' },
  { key: 'meeting', icon: Monitor, label: 'Capture Meeting',  desc: 'Record a live Zoom/Teams call' },
]

const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// ─── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ active, bars }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className={clsx('w-1.5 rounded-full', active ? 'bg-indigo-500' : 'bg-white/10')}
          animate={{ height: active ? h : 4 }}
          transition={{ duration: 0.08, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ─── Agent progress ────────────────────────────────────────────────────────────
function AgentProgress({ stepIdx }) {
  return (
    <div className="max-w-md w-full mx-auto card space-y-3">
      <div className="text-center mb-5">
        <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Brain className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="font-bold text-lg">Analyzing Your Interview</h3>
        <p className="text-sm text-gray-500 mt-1">4 AI agents working in parallel</p>
      </div>

      {AGENT_STEPS.map((step, i) => {
        const done   = i < stepIdx
        const active = i === stepIdx
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: done ? 0.5 : active ? 1 : 0.3 }}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-xl transition-colors',
              active && 'bg-indigo-600/10 border border-indigo-600/20'
            )}
          >
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
              done   ? 'bg-green-600 text-white' :
              active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' :
                       'bg-white/[0.06] text-gray-600'
            )}>
              {done ? '✓' : i + 1}
            </div>
            <div className="flex-1">
              <p className={clsx('text-sm font-semibold', active ? 'text-white' : 'text-gray-500')}>{step.label}</p>
              {active && <p className="text-xs text-indigo-400 mt-0.5">{step.sub}</p>}
            </div>
            {active && (
              <div className="flex gap-1">
                {[0,1,2].map(j => (
                  <motion.div
                    key={j}
                    className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.15 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )
      })}
      <p className="text-center text-xs text-gray-700 pt-2">Takes 30–60 seconds · Don't close this tab</p>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Interview() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') || 'live'

  const [recordMode, setRecordMode]         = useState(initialMode)
  const [phase, setPhase]                   = useState('setup')
  const [interviewType, setInterviewType]   = useState('technical-swe')
  const [currentQ, setCurrentQ]             = useState(0)
  const [recordingTime, setRecordingTime]   = useState(0)
  const [audioBlob, setAudioBlob]           = useState(null)
  const [uploadedFile, setUploadedFile]     = useState(null)
  const [isAnalyzing, setIsAnalyzing]       = useState(false)
  const [stepIdx, setStepIdx]               = useState(0)
  const [error, setError]                   = useState(null)
  const [bars, setBars]                     = useState(Array(44).fill(4))
  const [meetingReady, setMeetingReady]     = useState(false)

  // Resume upload state
  const [resumeFile, setResumeFile]         = useState(null)
  const [resumeLoading, setResumeLoading]   = useState(false)
  const [resumeError, setResumeError]       = useState(null)
  const [tailoredData, setTailoredData]     = useState(null)  // { questions, role, key_skills }

  const recorderRef  = useRef(null)
  const chunksRef    = useRef([])
  const timerRef     = useRef(null)
  const frameRef     = useRef(null)
  const streamRef    = useRef(null)

  const questions = tailoredData?.questions || QUESTIONS[interviewType] || QUESTIONS.general
  const total     = questions.length

  // ── Upload + generate tailored questions from resume ────────────────────────
  const handleResumeUpload = useCallback(async (file) => {
    if (!file) return
    setResumeFile(file)
    setResumeError(null)
    setTailoredData(null)
    setResumeLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file, file.name)
      fd.append('interview_type', interviewType)
      const res = await fetch('/api/generate-questions', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to read resume' }))
        throw new Error(err.detail || 'Failed to read resume')
      }
      const data = await res.json()
      setTailoredData(data)
    } catch (e) {
      setResumeError(e.message)
    } finally {
      setResumeLoading(false)
    }
  }, [interviewType])

  const clearResume = () => {
    setResumeFile(null)
    setTailoredData(null)
    setResumeError(null)
    setResumeLoading(false)
  }

  useEffect(() => () => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // ── Start mic-only recording ─────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      _beginRecording(stream)
      setPhase('recording')
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }, [])

  // ── Start meeting capture (system audio + mic mixed) ────────────────────────
  const startMeetingCapture = useCallback(async () => {
    setError(null)
    try {
      // Get display media (system audio) — user must check "Share system audio"
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 },
      })

      const sysAudioTracks = displayStream.getAudioTracks()
      if (sysAudioTracks.length === 0) {
        displayStream.getTracks().forEach(t => t.stop())
        setError('No system audio detected. When sharing your screen, make sure to check "Share system audio" (Chrome) or "Include system audio" (Edge).')
        return
      }

      // Also grab mic so your own voice is captured too
      let micStream = null
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        // mic denied — proceed with system audio only
      }

      // Mix both sources via AudioContext
      const ctx  = new AudioContext()
      const dest = ctx.createMediaStreamDestination()

      const sysSrc = ctx.createMediaStreamSource(new MediaStream(sysAudioTracks))
      sysSrc.connect(dest)

      if (micStream) {
        const micSrc = ctx.createMediaStreamSource(micStream)
        micSrc.connect(dest)
        streamRef.current = new MediaStream([
          ...displayStream.getTracks(),
          ...micStream.getTracks(),
        ])
      } else {
        streamRef.current = displayStream
      }

      // Stop video track (not needed, saves bandwidth)
      displayStream.getVideoTracks().forEach(t => t.stop())

      _beginRecording(dest.stream)
      setPhase('recording')
    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'AbortError') {
        setError('Screen sharing cancelled. Click "Start Capture" and share your screen to begin.')
      } else {
        setError('Could not start meeting capture: ' + e.message)
      }
    }
  }, [])

  // ── Shared recording setup ───────────────────────────────────────────────────
  const _beginRecording = (stream) => {
    const ctx      = new AudioContext()
    const src      = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    src.connect(analyser)

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder
    chunksRef.current   = []

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      setAudioBlob(new Blob(chunksRef.current, { type: mimeType }))
      stream.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(frameRef.current)
      setBars(Array(44).fill(4))
    }

    recorder.start(250)
    setCurrentQ(0)
    setRecordingTime(0)
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)

    const animate = () => {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      setBars(Array.from({ length: 44 }, (_, i) => Math.max(4, (data[Math.floor((i / 44) * data.length)] / 255) * 64)))
      frameRef.current = requestAnimationFrame(animate)
    }
    animate()
  }

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setPhase('review')
  }, [])

  const runAnalysis = async (file, filename) => {
    setIsAnalyzing(true)
    setError(null)
    setStepIdx(0)
    setPhase('analyzing')

    const timers = [3500, 8000, 13000, 19000].map((d, i) =>
      setTimeout(() => setStepIdx(i + 1), d)
    )

    try {
      const fd = new FormData()
      fd.append('file', file, filename)
      fd.append('interview_type', interviewType)

      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Analysis failed' }))
        throw new Error(err.detail || 'Analysis failed')
      }

      const data = await res.json()
      timers.forEach(clearTimeout)
      setStepIdx(AGENT_STEPS.length - 1)
      setTimeout(() => navigate('/results', { state: { result: data } }), 700)
    } catch (err) {
      timers.forEach(clearTimeout)
      setError(err.message)
      setIsAnalyzing(false)
      setPhase(audioBlob ? 'review' : 'uploaded')
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#080c14] flex flex-col">
        <Nav />

        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">

            {/* ── SETUP ─────────────────────────────────────────── */}
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col items-center justify-center px-6 py-12"
              >
                <div className="max-w-lg w-full space-y-6">
                  <div className="text-center mb-2">
                    <h2 className="text-3xl font-black mb-2">New Interview Session</h2>
                    <p className="text-gray-500 text-sm">Choose how you want to record, then pick your interview type.</p>
                  </div>

                  {/* Mode toggle */}
                  <div className="grid grid-cols-3 gap-3">
                    {MODES.map(m => (
                      <button
                        key={m.key}
                        onClick={() => { setRecordMode(m.key); setError(null) }}
                        className={clsx(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center',
                          recordMode === m.key
                            ? 'bg-indigo-600/15 border-indigo-600/40 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/[0.12] hover:text-gray-300'
                        )}
                      >
                        <m.icon className={clsx('w-5 h-5', recordMode === m.key ? 'text-indigo-400' : '')} />
                        <div>
                          <p className="text-xs font-semibold leading-tight">{m.label}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{m.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Interview type */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2 block">Interview Type</label>
                    <div className="relative">
                      <select
                        value={interviewType}
                        onChange={e => {
                          setInterviewType(e.target.value)
                          // Re-generate if resume already uploaded
                          if (resumeFile && !resumeLoading) {
                            setTailoredData(null)
                            handleResumeUpload(resumeFile)
                          }
                        }}
                        className="w-full bg-[#0f1623] border border-white/[0.08] rounded-xl px-4 py-3.5 appearance-none text-white focus:outline-none focus:border-indigo-500/50 transition-colors pr-10 text-sm font-medium"
                      >
                        {INTERVIEW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* ── Resume Upload ─────────────────────────────── */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2 block">
                      Resume Upload <span className="normal-case text-gray-600 tracking-normal">(optional — generates tailored questions)</span>
                    </label>

                    {!resumeFile ? (
                      <label className="cursor-pointer">
                        <div className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/[0.08] hover:border-indigo-600/40 hover:bg-indigo-600/5 transition-all text-gray-500 hover:text-gray-300">
                          <FileText className="w-5 h-5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Upload your resume / CV</p>
                            <p className="text-xs text-gray-600 mt-0.5">PDF or plain text · AI generates 5 questions tailored to your background</p>
                          </div>
                          <Upload className="w-4 h-4 ml-auto shrink-0 opacity-50" />
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.txt,.doc,.docx,text/plain"
                          onChange={e => { const f = e.target.files[0]; if (f) handleResumeUpload(f) }}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className={`rounded-xl border p-4 transition-all ${
                        tailoredData
                          ? 'border-indigo-600/30 bg-indigo-600/5'
                          : resumeError
                          ? 'border-red-600/30 bg-red-600/5'
                          : 'border-white/[0.08] bg-white/[0.02]'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            tailoredData ? 'bg-indigo-600/20' : resumeError ? 'bg-red-600/20' : 'bg-white/[0.06]'
                          }`}>
                            {resumeLoading
                              ? <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                              : tailoredData
                              ? <Wand2 className="w-4 h-4 text-indigo-400" />
                              : resumeError
                              ? <AlertCircle className="w-4 h-4 text-red-400" />
                              : <FileText className="w-4 h-4 text-gray-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{resumeFile.name}</p>
                            {resumeLoading && (
                              <p className="text-xs text-indigo-400 mt-0.5">Reading your resume and crafting questions…</p>
                            )}
                            {tailoredData && (
                              <p className="text-xs text-indigo-300 mt-0.5">
                                ✓ Questions tailored for <span className="font-semibold">{tailoredData.role}</span>
                                {tailoredData.key_skills?.length > 0 && (
                                  <span className="text-gray-500"> · {tailoredData.key_skills.join(', ')}</span>
                                )}
                              </p>
                            )}
                            {resumeError && (
                              <p className="text-xs text-red-400 mt-0.5">{resumeError} — using default questions</p>
                            )}
                          </div>
                          <button
                            onClick={clearResume}
                            className="text-gray-600 hover:text-gray-300 transition-colors shrink-0 mt-0.5"
                            title="Remove resume"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Questions preview — live mode only */}
                  {recordMode === 'live' && (
                    <div className="card border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-4">
                        <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold">You'll answer these questions</p>
                        {tailoredData && (
                          <span className="text-[10px] bg-indigo-600/20 text-indigo-300 border border-indigo-600/20 rounded-full px-2 py-0.5 font-semibold">
                            ✦ Tailored to your resume
                          </span>
                        )}
                      </div>
                      <ol className="space-y-3">
                        {questions.map((q, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="w-5 h-5 rounded-full bg-white/[0.05] text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-gray-400 leading-relaxed">{q}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Meeting mode instructions */}
                  {recordMode === 'meeting' && (
                    <div className="card border-indigo-600/20 bg-indigo-600/5 space-y-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-indigo-300 font-semibold">How to capture a live Zoom or Teams interview</p>
                      </div>
                      <ol className="space-y-2 text-sm text-gray-400">
                        {[
                          'Start your Zoom / Teams call on this computer',
                          'Click "Start Capture" below and share your entire screen',
                          'Check "Share system audio" (Chrome) or "Include system audio" (Edge) in the browser dialog',
                          'The app records both the interviewer\'s voice and yours in real time',
                          'Click "Stop & Analyze" when the interview ends',
                        ].map((step, i) => (
                          <li key={i} className="flex gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="flex items-center gap-2 pt-1 text-xs text-gray-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Works best in Chrome or Edge. Safari does not support system audio capture.
                      </div>
                    </div>
                  )}

                  {/* Upload drop zone */}
                  {recordMode === 'upload' && (
                    <label>
                      <div className="w-full card border-dashed border-white/[0.08] hover:border-indigo-600/40 hover:bg-indigo-600/5 transition-all cursor-pointer flex flex-col items-center gap-3 py-10">
                        <Upload className="w-8 h-8 text-gray-600" />
                        <div className="text-center">
                          <p className="font-semibold">Drop your recording here</p>
                          <p className="text-sm text-gray-500 mt-1">MP3, MP4, WAV, WebM, M4A, OGG · Any Zoom or Teams export</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        onChange={e => {
                          const f = e.target.files[0]
                          if (f) { setUploadedFile(f); setPhase('uploaded') }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-red-400 text-sm flex gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  {/* CTA button */}
                  {recordMode === 'live' && (
                    <button onClick={startRecording} className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2">
                      <Mic className="w-5 h-5" /> Begin Interview <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {recordMode === 'meeting' && (
                    <button onClick={startMeetingCapture} className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2">
                      <Play className="w-5 h-5" /> Start Capture <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── RECORDING ─────────────────────────────────────── */}
            {phase === 'recording' && (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {/* Interview room top bar */}
                <div className="border-b border-white/[0.04] px-6 py-3 flex items-center justify-between bg-[#0a0f1a]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-400 font-semibold font-mono">{fmt(recordingTime)}</span>
                    <span className="text-xs text-gray-600 ml-2">
                      {recordMode === 'meeting' ? 'Capturing meeting audio…' : 'Recording in progress'}
                    </span>
                  </div>
                  {recordMode === 'live' && (
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: total }).map((_, i) => (
                        <div
                          key={i}
                          className={clsx(
                            'rounded-full transition-all duration-300',
                            i < currentQ ? 'w-2 h-2 bg-indigo-600' :
                            i === currentQ ? 'w-4 h-2 bg-indigo-500' :
                            'w-2 h-2 bg-white/10'
                          )}
                        />
                      ))}
                      <span className="text-xs text-gray-600 ml-2">{currentQ + 1}/{total}</span>
                    </div>
                  )}
                  {recordMode === 'meeting' && (
                    <div className="flex items-center gap-2 text-xs text-indigo-400">
                      <Monitor className="w-3.5 h-3.5" />
                      Capturing system + mic audio
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto w-full gap-6">

                  {/* Meeting mode — simplified UI */}
                  {recordMode === 'meeting' && (
                    <div className="w-full card border-indigo-600/15 bg-indigo-600/5 text-center py-8">
                      <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Monitor className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">Meeting capture active</h3>
                      <p className="text-sm text-gray-500 mb-4">Recording both the interviewer and your voice. The timer is running.</p>
                      <p className="text-xs text-gray-700">Go back to your Zoom/Teams window and conduct the interview normally.<br />Return here when it's over to stop and analyze.</p>
                    </div>
                  )}

                  {/* Live mode — question card */}
                  {recordMode === 'live' && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQ}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full card border-indigo-600/15 bg-indigo-600/5"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <Brain className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-indigo-300">AI Interviewer</p>
                            <p className="text-xs text-indigo-600">Listening to your answer…</p>
                          </div>
                          <div className="ml-auto flex gap-1">
                            {[0,1,2,3].map(i => (
                              <motion.div
                                key={i}
                                className="w-1 h-1 bg-indigo-500/60 rounded-full"
                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xl font-semibold leading-relaxed text-white">{questions[currentQ]}</p>
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {/* Waveform */}
                  <div className="w-full card bg-[#0a0f1a] border-white/[0.04] py-5">
                    <Waveform active={true} bars={bars} />
                  </div>

                  {/* Controls */}
                  <div className="flex gap-3 w-full">
                    {recordMode === 'live' && currentQ < total - 1 ? (
                      <>
                        <button
                          onClick={() => setCurrentQ(q => q + 1)}
                          className="flex-1 btn-secondary flex items-center justify-center gap-2"
                        >
                          Next Question <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={stopRecording}
                          title="End interview early"
                          className="w-12 h-12 bg-red-600/20 hover:bg-red-600/30 border border-red-600/20 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Square className="w-4 h-4 text-red-400" />
                        </button>
                      </>
                    ) : (
                      <button onClick={stopRecording} className="flex-1 btn-danger flex items-center justify-center gap-2 py-4">
                        <Square className="w-4 h-4" />
                        {recordMode === 'meeting' ? 'Stop & Analyze Meeting' : 'Finish & Analyze'}
                      </button>
                    )}
                  </div>

                  {recordMode === 'live' && (
                    <p className="text-xs text-gray-700">Recording continuously — advance when you're ready for the next question</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── REVIEW ────────────────────────────────────────── */}
            {phase === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col items-center justify-center px-6 py-12"
              >
                <div className="max-w-md w-full space-y-5">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </motion.div>
                    <h2 className="text-2xl font-black mb-1">
                      {recordMode === 'meeting' ? 'Meeting Captured' : 'Interview Complete'}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {fmt(recordingTime)} recorded
                      {recordMode === 'live' ? ` · ${total} questions` : ''}
                    </p>
                  </div>

                  {recordMode === 'live' && (
                    <div className="card">
                      {questions.map((q, i) => (
                        <div key={i} className={clsx('flex gap-3 text-sm py-2.5', i < questions.length - 1 && 'border-b border-white/[0.04]')}>
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-gray-400">{q}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {recordMode === 'meeting' && (
                    <div className="card border-indigo-600/15 bg-indigo-600/5">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">Meeting audio captured</p>
                          <p className="text-xs text-gray-500 mt-0.5">System + mic · {fmt(recordingTime)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setAudioBlob(null); setRecordingTime(0); setCurrentQ(0); setError(null); setPhase('setup') }}
                      className="btn-secondary flex items-center gap-2 text-sm"
                    >
                      <Mic className="w-4 h-4" /> Re-record
                    </button>
                    <button
                      onClick={() => runAnalysis(audioBlob, recordMode === 'meeting' ? 'meeting.webm' : 'interview.webm')}
                      className="flex-1 btn-primary flex items-center justify-center gap-2 py-4"
                    >
                      <Sparkles className="w-5 h-5" /> Analyze with AI
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── UPLOADED ──────────────────────────────────────── */}
            {phase === 'uploaded' && (
              <motion.div
                key="uploaded"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col items-center justify-center px-6 py-12"
              >
                <div className="max-w-md w-full space-y-5">
                  <div className="text-center">
                    <h2 className="text-2xl font-black mb-1">File Ready</h2>
                    <p className="text-gray-500">Run all 4 AI agents on your recording.</p>
                  </div>

                  <div className="card border-green-600/15 bg-green-600/5 flex items-center gap-4">
                    <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{uploadedFile?.name}</p>
                      <p className="text-sm text-gray-500">{uploadedFile ? (uploadedFile.size / 1024 / 1024).toFixed(1) : 0} MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2 block">Interview Type</label>
                    <div className="relative">
                      <select
                        value={interviewType}
                        onChange={e => setInterviewType(e.target.value)}
                        className="w-full bg-[#0f1623] border border-white/[0.08] rounded-xl px-4 py-3.5 appearance-none text-white focus:outline-none focus:border-indigo-500/50 text-sm font-medium pr-10"
                      >
                        {INTERVIEW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {error && <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setUploadedFile(null); setPhase('setup') }}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Change File
                    </button>
                    <button
                      onClick={() => runAnalysis(uploadedFile, uploadedFile.name)}
                      className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 text-base"
                    >
                      <Sparkles className="w-5 h-5" /> Analyze with AI
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ANALYZING ─────────────────────────────────────── */}
            {phase === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center px-6 py-12"
              >
                <AgentProgress stepIdx={stepIdx} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}
