import { supabaseAdmin } from '@/lib/supabase'
import { sendTicketEmail } from '@/lib/email'
import { generateLavidaExcel } from '@/lib/analytics'
import { Resend } from 'resend'
import { EVENTO } from '@/lib/evento'

/**
 * Activa todas las entradas de una orden pagada: las marca activas, les
 * genera el enlace del QR, manda el correo al comprador y el Excel al dueño.
 *
 * Lo llaman dos caminos distintos, y por eso vive aparte:
 *  - /api/bold-webhook, cuando Bold avisa del pago.
 *  - /api/ticket-status, cuando la persona vuelve a /pago-exitoso y la
 *    entrada sigue pendiente: se le pregunta a Bold directamente si el link
 *    ya esta PAID. Asi el comprador recibe su entrada aunque el webhook no
 *    llegue (no registrado, firma distinta, caida) — que fue exactamente lo
 *    que paso en la primera compra real del 12/09/2026.
 *
 * Es idempotente: si la orden ya esta activa no hace nada.
 */

const OWNER_EMAIL = 'pipesantos93@gmail.com'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.pipesantos.com').replace(/\/$/, '')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export type ResultadoActivacion =
  | { ok: true; yaEstaba: boolean; entradas: number; orderId: string }
  | { ok: false; motivo: 'orden_invalida' | 'no_encontrada' }

export async function activarOrden(orderId: string, paymentMethod = 'Bold'): Promise<ResultadoActivacion> {
  if (!UUID_RE.test(orderId)) return { ok: false, motivo: 'orden_invalida' }
  const db = supabaseAdmin()

  const { data: tickets, error } = await db
    .from('lavida_tickets')
    .select('*')
    .like('ticket_number', `${orderId}-%`)
  if (error) console.error('activarOrden: error buscando entradas', orderId, error.message)
  if (!tickets || tickets.length === 0) return { ok: false, motivo: 'no_encontrada' }

  if (tickets.every(t => t.status === 'active')) {
    return { ok: true, yaEstaba: true, entradas: tickets.length, orderId }
  }

  const buyer = tickets[0]
  const now = new Date().toISOString()

  const ordenadas = [...tickets].sort((a, b) => String(a.ticket_number).localeCompare(String(b.ticket_number)))
  for (const [i, ticket] of ordenadas.entries()) {
    if (ticket.status === 'active') continue
    const ticketUrl = `${APP_URL}/lavida/ticket/${ticket.ticket_number}`

    await db.from('lavida_tickets').update({
      status: 'active',
      qr_data: ticketUrl,
      paid_at: now,
      payment_method: paymentMethod,
    }).eq('ticket_number', ticket.ticket_number)

    try {
      await sendTicketEmail({
        to: buyer.buyer_email,
        name: buyer.buyer_name,
        eventName: EVENTO.nombre,
        eventDate: EVENTO.fechaTexto,
        eventLocation: `${EVENTO.lugar} · ${EVENTO.ciudad}`,
        tierName: 'Entrada General',
        ticketId: ticket.ticket_number,
        ticketPageUrl: ticketUrl,
        posicion: { indice: i + 1, total: ordenadas.length },
      })
    } catch (err) {
      console.error('Email error for', ticket.ticket_number, err)
    }
  }

  console.log(`✓ ${tickets.length} ticket(s) confirmed: ${orderId} for ${buyer.buyer_email}`)

  // ── Excel actualizado al dueño ─────────────────────────────────────────
  try {
    const { buffer, filename, totalBuyers } = await generateLavidaExcel()
    const resend = new Resend(process.env.RESEND_API_KEY)

    const buyerInfo = [
      `<b>Nombre:</b> ${escapeHtml(buyer.buyer_name)}`,
      `<b>Correo:</b> ${escapeHtml(buyer.buyer_email)}`,
      `<b>Cédula:</b> ${escapeHtml(buyer.buyer_cedula ?? '-')}`,
      `<b>Teléfono:</b> ${escapeHtml(buyer.buyer_phone ?? '-')}`,
      `<b>Entradas:</b> ${tickets.length}`,
      `<b>Medio de pago:</b> ${escapeHtml(paymentMethod)}`,
    ].join('<br>')
    const safeSubjectName = buyer.buyer_name.replace(/[\r\n<>]/g, '').slice(0, 80)

    await resend.emails.send({
      from: 'Pipe Santos Entradas <entradas@pipesantos.com>',
      to: OWNER_EMAIL,
      subject: `💰 Nueva venta — ${safeSubjectName} · ${tickets.length} entrada${tickets.length > 1 ? 's' : ''}`,
      html: `
        <div style="font-family:sans-serif;color:#1a1a1a;max-width:480px">
          <h2 style="color:#8B3CF7;margin:0 0 16px">✅ Pago confirmado</h2>
          <div style="background:#f8f5ff;border-radius:8px;padding:16px;margin-bottom:16px;line-height:1.8">
            ${buyerInfo}
          </div>
          <p style="color:#666;font-size:13px;margin:0">
            Total acumulado: <b>${totalBuyers} comprador${totalBuyers !== 1 ? 'es' : ''}</b> ·
            El Excel completo va adjunto.
          </p>
        </div>
      `,
      attachments: [{ filename, content: buffer.toString('base64') }],
    })
    console.log(`📊 Excel enviado a ${OWNER_EMAIL} (${totalBuyers} compradores)`)
  } catch (analyticsErr) {
    console.error('Analytics email error:', analyticsErr)
  }

  return { ok: true, yaEstaba: false, entradas: tickets.length, orderId }
}
