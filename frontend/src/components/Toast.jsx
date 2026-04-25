import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

// ─── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const toast = useCallback((message, { type = 'success', duration = 3500 } = {}) => {
    const id = ++idRef.current
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ─── Single toast ──────────────────────────────────────────────────────────────
const ICONS = {
  success: { Icon: CheckCircle, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  error:   { Icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'   },
  info:    { Icon: Info,        color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20'},
}

function Toast({ id, message, type, onDismiss }) {
  const { Icon, color, bg, border } = ICONS[type] || ICONS.info

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm ${bg} ${border}`}
      style={{ minWidth: 240, maxWidth: 340, background: 'rgba(17,17,19,0.95)' }}
    >
      <Icon className={`w-4 h-4 shrink-0 ${color}`} />
      <p className="text-sm font-medium text-white flex-1">{message}</p>
      <button onClick={onDismiss} className="text-gray-600 hover:text-gray-400 transition-colors shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}
