'use client'

/**
 * Cliente de analítica ligero.
 * - Genera un session_id por pestaña (sessionStorage)
 * - Hace batching: agrupa eventos y los envía cada 1.5s o al cerrar la pestaña
 * - Usa navigator.sendBeacon en pagehide para no perder datos
 */

const STORAGE_KEY = 'ps_session_id'

type EventInput = {
  type: 'page_view' | 'section_time' | 'click'
  section?: string
  target?: string
  duration_ms?: number
}

type QueuedEvent = EventInput & {
  session_id: string
  referrer?: string
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
    sessionStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

let queue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flush(useBeacon = false) {
  if (queue.length === 0) return
  const events = queue
  queue = []
  const payload = JSON.stringify({ events })

  try {
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/track', blob)
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // No-op: nunca romper la página por analítica
  }
}

export function track(ev: EventInput) {
  if (typeof window === 'undefined') return
  queue.push({
    ...ev,
    session_id: getSessionId(),
    referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : undefined,
  })
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => flush(false), 1500)
}

// Listeners globales para no perder datos al cerrar
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => flush(true))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true)
  })
}
