import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { registrarVisita, registrarClic } from '@/lib/reporte-landing'

export const dynamic = 'force-dynamic'

/**
 * POST /api/landing/visita  { session_id, tipo: 'visita' | 'clic', referrer? }
 *
 * La landing lo llama al cargar (una vez por sesion) y al tocar cualquier
 * boton de compra. Cada 10 visitas, lib/reporte-landing manda el reporte.
 * Nunca rompe la pagina: si algo falla responde ok igual.
 */
const intentos = new Map<string, number[]>()
function limitado(ip: string): boolean {
  const ahora = Date.now()
  const t = (intentos.get(ip) ?? []).filter(x => ahora - x < 60_000)
  if (t.length >= 40) return true
  intentos.set(ip, [...t, ahora])
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (limitado(ip)) return NextResponse.json({ ok: true })

  let body: { session_id?: unknown; tipo?: unknown; referrer?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: true }) }

  const sessionId = String(body.session_id ?? '')
  if (!/^[a-z0-9-]{6,64}$/i.test(sessionId)) return NextResponse.json({ ok: true })
  const tipo = body.tipo === 'clic' ? 'clic' : 'visita'
  const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 300) || null : null

  const salt = process.env.ANALYTICS_SALT
  const ipHash = createHash('sha256').update(salt ? `${ip}-${salt}` : `${ip}-${Date.now()}`).digest('hex').slice(0, 16)
  const userAgent = req.headers.get('user-agent')?.slice(0, 300) ?? null

  try {
    if (tipo === 'clic') await registrarClic({ sessionId, userAgent, ipHash })
    else await registrarVisita({ sessionId, referrer, userAgent, ipHash })
  } catch (e) {
    console.error('landing/visita:', e)
  }
  return NextResponse.json({ ok: true })
}
