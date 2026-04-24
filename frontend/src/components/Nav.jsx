import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, LayoutDashboard, Plus } from 'lucide-react'
import clsx from 'clsx'

export default function Nav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const name = localStorage.getItem('ic_name') || ''
  const initial = name ? name[0].toUpperCase() : 'U'

  return (
    <nav className="border-b border-white/[0.06] px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-[#080c14]/90 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
            <Brain className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <span className="font-bold text-[15px] tracking-tight">Interview Copilot</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => navigate('/dashboard')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              pathname === '/dashboard' ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/interview')}
          className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          New Interview
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-8 h-8 bg-indigo-600/20 border border-indigo-600/30 rounded-full flex items-center justify-center text-xs font-bold text-indigo-400 hover:bg-indigo-600/30 transition-colors"
          title={name || 'Dashboard'}
        >
          {initial}
        </button>
      </div>
    </nav>
  )
}
