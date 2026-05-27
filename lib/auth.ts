import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

/**
 * Compara dos secrets de forma constante en tiempo — previene timing attacks.
 * Si las longitudes difieren, devuelve false sin comparar (también constante).
 */
function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) {
    // Aún así hacemos una operación de longitud constante para no filtrar info por timing
    timingSafeEqual(ab, ab)
    return false
  }
  return timingSafeEqual(ab, bb)
}

/**
 * Verifica el Bearer token contra ADMIN_SECRET con comparación timing-safe.
 * Devuelve NextResponse 401 si falla, o null si es válido.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const expected = process.env.ADMIN_SECRET ?? ''

  if (!safeEqual(secret, expected)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return null
}

/**
 * Devuelve solo si el secret es válido (boolean). Para casos donde necesitas
 * más control sobre la respuesta.
 */
export function isValidAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7) : null
  return safeEqual(secret, process.env.ADMIN_SECRET ?? '')
}

/**
 * Verifica un Bearer token contra un secret arbitrario (timing-safe).
 * Útil para endpoints internos como cron jobs.
 */
export function requireBearer(req: NextRequest, expected: string | undefined): NextResponse | null {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!safeEqual(secret, expected ?? '')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return null
}
