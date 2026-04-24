import { useNavigate } from 'react-router-dom'
import { Mic, Upload, Brain, MessageSquare, Target, Zap, ArrowRight, CheckCircle } from 'lucide-react'

const AGENTS = [
  { icon: Brain,          color: 'text-indigo-400',  bg: 'bg-indigo-400/10', label: 'Technical Evaluator',    desc: 'Depth, accuracy & missing concepts' },
  { icon: MessageSquare,  color: 'text-purple-400',  bg: 'bg-purple-400/10', label: 'Communication Coach',    desc: 'Structure, clarity & STAR method' },
  { icon: Mic,            color: 'text-violet-400',  bg: 'bg-violet-400/10', label: 'Confidence Analyzer',    desc: 'Hedging, filler words & assertiveness' },
  { icon: Target,         color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10',label: 'Feedback Synthesizer',  desc: 'Prioritized action plan' },
]

const SOCIAL_PROOF = [
  '"You hesitated at 0:32 — this is where you lost the interviewer."',
  '"You never mentioned Big-O. That\'s an auto-reject at FAANG."',
  '"Said \'I think\' 8 times. Sounds uncertain even when you\'re right."',
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-gray-800/60 px-8 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-50 bg-gray-950/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Interview Copilot</span>
          <span className="text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 px-2 py-0.5 rounded-full font-medium">AI</span>
        </div>
        <button
          onClick={() => navigate('/interview?mode=upload')}
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" /> Upload recording
        </button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center px-6 pt-20 pb-16 text-center relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="animate-fade-up inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-600/25 text-indigo-400 text-sm px-4 py-1.5 rounded-full mb-8 font-medium">
          <Zap className="w-3.5 h-3.5" />
          Multi-agent AI analysis — 4 specialists reviewing every answer
        </div>

        <h1 className="animate-fade-up stagger-1 text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl leading-[1.05]">
          Your personal interviewer<br />
          that tells you{' '}
          <span className="gradient-text">what actually went wrong</span>
        </h1>

        <p className="animate-fade-up stagger-2 text-gray-400 text-xl max-w-2xl mb-4 leading-relaxed">
          No company tells you why you got rejected. Interview Copilot sits in on your interview,
          breaks down every answer, and gives you a specific plan to fix it.
        </p>

        {/* Rotating feedback examples */}
        <div className="animate-fade-up stagger-3 flex flex-col gap-2 mb-12">
          {SOCIAL_PROOF.map((quote, i) => (
            <div key={i} className="text-sm text-gray-500 italic">{quote}</div>
          ))}
        </div>

        {/* CTA */}
        <div className="animate-fade-up stagger-3 flex flex-col sm:flex-row gap-4 w-full max-w-md mb-4">
          <button
            onClick={() => navigate('/interview?mode=live')}
            className="flex-1 btn-primary flex items-center justify-center gap-2 text-base py-4 group"
          >
            <Mic className="w-5 h-5" />
            Start Mock Interview
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/interview?mode=upload')}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 text-base py-4"
          >
            <Upload className="w-5 h-5" />
            Upload Recording
          </button>
        </div>
        <div className="animate-fade-up stagger-3 mb-16">
          <button
            onClick={() => navigate('/results')}
            className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
          >
            See a sample report first →
          </button>
        </div>

        {/* Agents */}
        <div className="animate-fade-up stagger-4 w-full max-w-4xl">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-medium mb-6">4 AI Agents analyzing your performance</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AGENTS.map(({ icon: Icon, color, bg, label, desc }) => (
              <div key={label} className="card-sm text-left hover:border-gray-700 transition-colors group">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="font-semibold text-sm mb-1">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="animate-fade-up stagger-5 w-full max-w-3xl mt-20">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-medium mb-8">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { step: '01', title: 'Record or Upload', desc: 'Do a live mock interview or upload a Zoom / phone recording' },
              { step: '02', title: 'AI Agents Analyze', desc: '4 specialist agents break down your technical depth, communication, and confidence in parallel' },
              { step: '03', title: 'Get Your Report', desc: 'Specific moment-by-moment feedback, scores, and a prioritized action plan' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <span className="text-3xl font-black text-gray-800 leading-none mt-1">{step}</span>
                <div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
