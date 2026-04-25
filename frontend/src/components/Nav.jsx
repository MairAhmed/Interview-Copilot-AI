import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, LayoutDashboard, Plus } from 'lucide-react'
import clsx from 'clsx'

export default function Nav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const name    = localStorage.getItem('ic_name') || ''
  const initial = name ? name[0].toUpperCase() : 'U'

  return (
    <nav
      className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
      style={{
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Left: logo + nav links */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
            }}
          >
            <Brain className="text-white" style={{ width: 17, height: 17 }} />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white">Interview Copilot</span>
        </button>

        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={() => navigate('/dashboard')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              pathname === '/dashboard'
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.04]'
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/interview')}
          className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
        >
          <Plus className="w-3.5 h-3.5" />
          New Interview
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#818cf8',
          }}
          title={name || 'Dashboard'}
        >
          {initial}
        </button>
      </div>
    </nav>
  )
}
