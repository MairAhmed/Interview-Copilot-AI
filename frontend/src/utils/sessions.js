// ─── Session storage helpers ───────────────────────────────────────────────
// All real analysis results are persisted here so the Dashboard
// shows actual history instead of mock data.

const KEY = 'ic_sessions'
const MAX_SESSIONS = 20

export function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveSession(result) {
  try {
    const sessions = getSessions()
    const now = new Date()

    const session = {
      id:             Date.now().toString(),
      timestamp:      now.getTime(),
      date:           now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      daysAgo:        'Just now',
      interview_type: result.interview_type || 'general',
      duration:       result.duration || 0,
      overall_score:  result.overall_score,
      technical:      result.scores?.technical?.score   ?? 0,
      communication:  result.scores?.communication?.score ?? 0,
      confidence:     result.scores?.confidence?.score  ?? 0,
      summary:        result.summary || '',
      filler_words:   result.filler_words || [],
      action_plan:    result.action_plan || [],
      scores:         result.scores || {},
      // Store prev_score based on the most recent previous session
      prev_score:     sessions[0]?.overall_score ?? null,
    }

    // Prepend (newest first), cap at MAX_SESSIONS
    const updated = [session, ...sessions].slice(0, MAX_SESSIONS)
    localStorage.setItem(KEY, JSON.stringify(updated))
    return session
  } catch (e) {
    console.error('Failed to save session', e)
    return null
  }
}

export function clearSessions() {
  localStorage.removeItem(KEY)
}

// Format "2 days ago", "1 week ago", etc.
export function timeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'Just now'
  if (mins < 60)  return `${mins} minutes ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days === 1) return 'Yesterday'
  if (days < 7)   return `${days} days ago`
  if (days < 14)  return '1 week ago'
  return `${Math.floor(days / 7)} weeks ago`
}

// Format duration seconds → "4m 12s"
export function fmtDuration(s) {
  if (!s) return '—'
  return s > 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`
}

// Map interview_type slug → readable label
export function typeLabel(slug) {
  const map = {
    'general':        'General / Behavioral',
    'technical-swe':  'Technical — SWE',
    'technical-data': 'Technical — Data Science',
    'product':        'Product Management',
    'leadership':     'Leadership',
    'finance':        'Finance / Consulting',
  }
  return map[slug] || slug?.replace(/-/g, ' ') || 'General'
}

// Short tag for session cards
export function typeTag(slug) {
  const map = {
    'general':        'GEN',
    'technical-swe':  'SWE',
    'technical-data': 'DS',
    'product':        'PM',
    'leadership':     'LDR',
    'finance':        'FIN',
  }
  return map[slug] || 'INT'
}

// Color per type
export function typeColor(slug) {
  const map = {
    'general':        '#6366f1',
    'technical-swe':  '#6366f1',
    'technical-data': '#8b5cf6',
    'product':        '#a78bfa',
    'leadership':     '#ec4899',
    'finance':        '#f59e0b',
  }
  return map[slug] || '#6366f1'
}
