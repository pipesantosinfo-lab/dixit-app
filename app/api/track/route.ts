import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

// Rate limiting: máx 200 eventos por minuto por IP (suficiente para sesión normal)
const trackTimestamps = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const times = (trackTimestamps.get(ip) ?? []).filter(t => now - t < 60_000)
  if (times.length >= 200) return true
  trackTimestamps.set(ip, [...times, now])
  return false
}

const VALID_TYPES = new Set(['page_view', 'section_time', 'click'])
const MAX_EVENTS_PER_REQUEST = 50

const SECTION_RE = /^[a-z0-9_]{1,50}$/
const TARGET_RE = /^[a-z0-9_]{1,50}$/

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const events = Array.isArray(body.events) ? (body.events as unknown[]).slice(0, MAX_EVENTS_PER_REQUEST) : []
  if (events.length === 0) return NextResponse.json({ ok: true })

  // Hash de IP con salt (no almacenamos IP en claro)
  const salt = process.env.ANALYTICS_SALT ?? 'pipesantos-default-salt-2026'
  const ipHash = createHash('sha256').update(`${ip}-${salt}`).digest('hex').slice(0, 16)
  const userAgent = req.headers.get('user-agent')?.slice(0, 300) ?? null

  const rows = events
    .map(raw => {
      const e = raw as Record<string, unknown>
      if (!e || typeof e.type !== 'string' || !VALID_TYPES.has(e.type)) return null
      const sessionId = String(e.session_id ?? '').slice(0, 64)
      if (!sessionId || !/^[a-z0-9-]{6,64}$/i.test(sessionId)) return null

      const section = typeof e.section === 'string' && SECTION_RE.test(e.section) ? e.section : null
      const target = typeof e.target === 'string' && TARGET_RE.test(e.target) ? e.target : null
      const duration = typeof e.duration_ms === 'number' && Number.isFinite(e.duration_ms)
        ? Math.max(0, Math.min(3_600_000, Math.floor(e.duration_ms)))
        : null
      const referrer = typeof e.referrer === 'string' ? e.referrer.slice(0, 300) : null

      return {
        session_id: sessionId,
        ip_hash: ipHash,
        event_type: e.type,
        section,
        target,
        duration_ms: duration,
        user_agent: userAgent,
        referrer,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length === 0) return NextResponse.json({ ok: true })

  try {
    const db = supabaseAdmin()
    await db.from('analytics_events').insert(rows)
  } catch (err) {
    console.error('Track insert error:', err)
    // No devolvemos error al cliente — analítica nunca debe romper UX
  }

  return NextResponse.json({ ok: true })
}
