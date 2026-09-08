import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'
import fs from 'node:fs'
import path from 'node:path'

/* Reproducciones del podcast.
 *
 * Cada episodio parte de una base acumulada y a partir de ahí suma las escuchas
 * reales: una por sesión y episodio, y sólo cuando alguien pasa de 5 segundos.
 * Se guardan en la misma tabla de analítica del sitio, que ya hashea la IP con
 * salt y nunca almacena datos identificables. */

const SLUG_RE = /^[a-z0-9-]{3,60}$/
const MIN_SEG = 5

type Ep = { slug: string; base: number }

let catalogo: Ep[] | null = null
function episodios(): Ep[] {
  if (catalogo) return catalogo
  try {
    const f = path.join(process.cwd(), 'public', 'podcast', 'episodios.json')
    catalogo = (JSON.parse(fs.readFileSync(f, 'utf8')) as Ep[]).map((e) => ({ slug: e.slug, base: e.base }))
  } catch {
    catalogo = []
  }
  return catalogo
}

// Los conteos se cachean un minuto: la cifra no necesita ser al segundo y así
// una visita no dispara diez consultas.
let cache: { en: number; datos: Record<string, number> } | null = null
const CACHE_MS = 60_000

// Un envío por IP cada 3s: evita que alguien infle el contador a fuerza de peticiones
const ultimos = new Map<string, number>()

function ipHash(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const salt = process.env.ANALYTICS_SALT ?? ''
  return createHash('sha256').update(`${ip}-${salt}-podcast`).digest('hex').slice(0, 16)
}

export async function GET() {
  const eps = episodios()
  const base: Record<string, number> = {}
  eps.forEach((e) => { base[e.slug] = e.base })

  if (cache && Date.now() - cache.en < CACHE_MS) {
    return NextResponse.json({ plays: cache.datos })
  }

  const datos = { ...base }
  try {
    const db = supabaseAdmin()
    const conteos = await Promise.all(
      eps.map(async (e) => {
        const { count } = await db
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'podcast_play')
          .eq('target', e.slug)
        return [e.slug, count ?? 0] as const
      }),
    )
    conteos.forEach(([slug, n]) => { datos[slug] = (base[slug] ?? 0) + n })
    cache = { en: Date.now(), datos }
  } catch {
    // Si la base falla, se devuelve el acumulado: la cifra nunca desaparece
  }

  return NextResponse.json({ plays: datos })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const slug = String(body.slug ?? '')
  const seg = Number(body.seg ?? 0)
  const sesion = String(body.session ?? '')

  if (!SLUG_RE.test(slug) || !episodios().some((e) => e.slug === slug)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (!Number.isFinite(seg) || seg < MIN_SEG) {
    return NextResponse.json({ ok: false, motivo: 'escucha corta' }, { status: 202 })
  }
  if (!/^[a-z0-9-]{6,64}$/i.test(sesion)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const hash = ipHash(req)
  const clave = `${hash}:${slug}`
  const ahora = Date.now()
  if (ahora - (ultimos.get(clave) ?? 0) < 3000) {
    return NextResponse.json({ ok: true, repetido: true })
  }
  ultimos.set(clave, ahora)

  try {
    const db = supabaseAdmin()
    // Una sola reproducción por sesión y episodio, aunque se reescuche
    const { count } = await db
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'podcast_play')
      .eq('target', slug)
      .eq('session_id', sesion)

    if ((count ?? 0) === 0) {
      await db.from('analytics_events').insert({
        session_id: sesion,
        ip_hash: hash,
        event_type: 'podcast_play',
        section: 'podcast',
        target: slug,
        duration_ms: Math.min(3_600_000, Math.floor(seg * 1000)),
        user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
        referrer: null,
      })
      cache = null   // que el siguiente GET vuelva a contar
    }
  } catch (err) {
    console.error('podcast play:', err)
  }

  return NextResponse.json({ ok: true })
}
