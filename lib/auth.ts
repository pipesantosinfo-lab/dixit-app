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

function tokenDe(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : null
}

/* ── Freno a los intentos fallidos ─────────────────────────────────────
 * Solo cuenta fallos, nunca aciertos, y el umbral es alto a propósito: en
 * la puerta de un evento varios celulares del staff salen por la misma IP
 * del wifi del sitio, y lo último que queremos es dejarlos fuera porque
 * entre todos escribieron mal el PIN unas cuantas veces. Contra fuerza
 * bruta igual sirve, porque adivinar el secreto pide millones de intentos.
 * Vive en memoria del proceso: en serverless cada instancia lleva su
 * propia cuenta, así que es una traba, no una garantía. */
const VENTANA_MS = 10 * 60_000
const MAX_FALLOS = 50
const MAX_IPS = 5_000

const fallos = new Map<string, number[]>()

function ipDe(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconocida'
}

function vigentes(ip: string): number[] {
  const ahora = Date.now()
  return (fallos.get(ip) ?? []).filter(t => ahora - t < VENTANA_MS)
}

function frenado(ip: string): boolean {
  return vigentes(ip).length >= MAX_FALLOS
}

function anotarFallo(ip: string): void {
  if (fallos.size > MAX_IPS) fallos.clear() // evita crecer sin límite
  fallos.set(ip, [...vigentes(ip), Date.now()])
}

function rechazar(ip: string): NextResponse {
  anotarFallo(ip)
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

/**
 * Acceso total al panel: listados con datos de compradores, exportación,
 * sorteos, ventas y galería. Solo lo tiene ADMIN_SECRET.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const ip = ipDe(req)
  if (frenado(ip)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
  }
  if (!safeEqual(tokenDe(req), process.env.ADMIN_SECRET ?? '')) {
    return rechazar(ip)
  }
  return null
}

/**
 * Acceso limitado a lo que necesita quien está en la puerta escaneando:
 * descargar entradas, marcarlas usadas y validar un QR. Nada más.
 *
 * Existe porque el PIN del validador se reparte entre el staff, y antes era
 * literalmente ADMIN_SECRET: cualquiera de la puerta podía pedir el listado
 * completo de compradores con sus cédulas y correos, exportar el Excel,
 * girar el sorteo o cerrar las ventas.
 *
 * ADMIN_SECRET sigue sirviendo aquí — el dueño entra a todo. Y si
 * VALIDATOR_SECRET no está configurado, esto se comporta igual que antes en
 * vez de dejar a nadie fuera; nunca queda abierto a cualquiera.
 */
export function requireValidator(req: NextRequest): NextResponse | null {
  const ip = ipDe(req)
  if (frenado(ip)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
  }
  const token = tokenDe(req)
  const delValidador = process.env.VALIDATOR_SECRET
  if (delValidador && safeEqual(token, delValidador)) return null
  if (safeEqual(token, process.env.ADMIN_SECRET ?? '')) return null
  return rechazar(ip)
}

/**
 * Devuelve solo si el secret es válido (boolean). Para casos donde necesitas
 * más control sobre la respuesta.
 */
export function isValidAdmin(req: NextRequest): boolean {
  return safeEqual(tokenDe(req), process.env.ADMIN_SECRET ?? '')
}

/**
 * Verifica un Bearer token contra un secret arbitrario (timing-safe).
 * Útil para endpoints internos como cron jobs.
 */
export function requireBearer(req: NextRequest, expected: string | undefined): NextResponse | null {
  if (!safeEqual(tokenDe(req), expected ?? '')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return null
}
