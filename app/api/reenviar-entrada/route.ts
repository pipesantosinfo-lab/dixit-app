import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTicketEmail } from '@/lib/email'
import { EVENTO } from '@/lib/evento'

export const dynamic = 'force-dynamic'

/**
 * POST /api/reenviar-entrada  { email }
 *
 * Reenvia al correo indicado todas sus entradas activas. Es la salida para
 * "pague y no me llego nada": spam, correo borrado, celular cambiado.
 *
 * Responde siempre lo mismo, exista o no el correo, para que nadie pueda
 * usarlo para averiguar quien compro. Maximo 3 reenvios por correo y por
 * IP cada hora.
 */
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.pipesantos.com').replace(/\/$/, '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const intentos = new Map<string, { n: number; hasta: number }>()
function limitado(clave: string, max = 3, ventana = 3_600_000): boolean {
  const ahora = Date.now()
  const e = intentos.get(clave)
  if (!e || e.hasta < ahora) { intentos.set(clave, { n: 1, hasta: ahora + ventana }); return false }
  e.n++
  return e.n > max
}

const RESPUESTA = { ok: true, mensaje: 'Si hay entradas compradas con ese correo, ya van en camino. Revisa también la carpeta de spam.' }

export async function POST(req: NextRequest) {
  let body: { email?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 }) }

  const email = String(body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return NextResponse.json({ error: 'Escribe un correo válido.' }, { status: 400 })
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sin-ip'
  if (limitado('email:' + email) || limitado('ip:' + ip, 10)) {
    return NextResponse.json({ error: 'Ya reenviamos varias veces. Espera un momento y revisa tu spam.' }, { status: 429 })
  }

  const db = supabaseAdmin()
  const { data: tickets } = await db
    .from('lavida_tickets')
    .select('ticket_number, buyer_name, status')
    .eq('buyer_email', email)
    .in('status', ['active', 'used'])
    .order('ticket_number')

  if (!tickets || tickets.length === 0) return NextResponse.json(RESPUESTA)

  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i]
    const url = `${APP_URL}/lavida/ticket/${t.ticket_number}`
    try {
      await sendTicketEmail({
        to: email,
        name: t.buyer_name,
        eventName: EVENTO.nombre,
        eventDate: EVENTO.fechaTexto,
        eventLocation: `${EVENTO.lugar} · ${EVENTO.ciudad}`,
        tierName: 'Entrada General',
        ticketId: t.ticket_number,
        ticketPageUrl: url,
        posicion: { indice: i + 1, total: tickets.length },
      })
    } catch (err) {
      console.error('reenviar-entrada: error enviando', t.ticket_number, err)
    }
  }
  console.log(`↩ reenviadas ${tickets.length} entrada(s) a ${email}`)
  return NextResponse.json(RESPUESTA)
}
