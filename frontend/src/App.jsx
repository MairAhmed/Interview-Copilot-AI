import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import Results from './pages/Results'

export default function App() {
  const location = useLocation()
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </AnimatePresence>
      </ToastProvider>
    </ErrorBoundary>
  )
}
