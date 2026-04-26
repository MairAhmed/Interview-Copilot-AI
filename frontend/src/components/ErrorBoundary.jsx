import { Component } from 'react'
import { RotateCcw, AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 font-mono bg-white/[0.04] rounded-xl p-3 text-left overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Go back to home
          </button>
        </div>
      </div>
    )
  }
}
