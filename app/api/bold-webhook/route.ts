import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTicketEmail } from '@/lib/email'
import { sendWhatsAppTicket } from '@/lib/whatsapp'
import { generateLavidaExcel } from '@/lib/analytics'
import { Resend } from 'resend'
import { createHmac, timingSafeEqual } from 'crypto'

const OWNER_EMAIL = 'pipesantos93@gmail.com'

const EVENT = {
  name: 'La vida es cule viaje',
  date: 'Sábado 22 de agosto de 2026 · 2:00 PM – 6:00 PM',
  location: 'Barranquilla, Colombia',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pipesantos.com'

function verifyBoldSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.BOLD_SECRET_KEY
  if (!secret) return false
  // Normalizar ambas firmas a minúsculas hex para comparación consistente
  const normalized = signature.trim().toLowerCase().replace(/^sha256=/, '')
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    const a = Buffer.from(normalized, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || a.length === 0) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-bold-signature') ?? req.headers.get('bold-signature')

  if (!verifyBoldSignature(rawBody, signature)) {
    console.warn('Bold webhook: firma inválida o ausente')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Bold sends the reference inside data.metadata.reference, status as body.type
  const data = body.data as Record<string, unknown> | undefined
  const metadata = data?.metadata as Record<string, unknown> | undefined

  const orderId = (metadata?.reference as string) ||
    (data?.reference as string) ||
    (body.reference as string) ||
    (body.order_id as string)

  const eventType = (body.type as string) || (body.status as string) || (body.event as string)

  if (!orderId) {
    console.warn('Bold webhook: no orderId found', body)
    return NextResponse.json({ received: true })
  }

  // Sanitizar comodines SQL antes de usar en LIKE — solo permitir UUID chars
  const safeOrderId = orderId.replace(/[^0-9a-f-]/gi, '')
  if (!safeOrderId) {
    console.warn('Bold webhook: orderId inválido después de sanitizar')
    return NextResponse.json({ received: true })
  }

  const isAccepted = ['SALE_APPROVED', 'ACCEPTED', 'APPROVED', 'payment_accepted'].includes(eventType)

  if (!isAccepted) {
    console.log('Bold webhook: ignoring event', eventType)
    return NextResponse.json({ received: true })
  }

  const db = supabaseAdmin()

  // Find all tickets for this order (usamos safeOrderId para prevenir wildcards SQL)
  const { data: tickets } = await db
    .from('lavida_tickets')
    .select('*')
    .like('ticket_number', `${safeOrderId}-%`)

  if (!tickets || tickets.length === 0) {
    console.error('Tickets not found for order:', safeOrderId)
    return NextResponse.json({ error: 'Tickets not found' }, { status: 404 })
  }

  if (tickets[0].status === 'active') {
    console.log('Already processed:', safeOrderId)
    return NextResponse.json({ received: true })
  }

  const buyer = tickets[0]
  const now = new Date().toISOString()

  // Extraer medio de pago del payload de Bold (varios campos posibles según versión de la API)
  const payment = data?.payment as Record<string, unknown> | undefined
  const paymentMethod: string =
    (payment?.payment_type as string) ||
    (payment?.payment_method as string) ||
    (payment?.method as string) ||
    (data?.payment_method as string) ||
    (body.payment_method as string) ||
    'Bold'

  // Activate all tickets and generate QR for each
  for (const ticket of tickets) {
    const ticketUrl = `${APP_URL}/lavida/ticket/${ticket.ticket_number}`

    await db.from('lavida_tickets').update({
      status: 'active',
      qr_data: ticketUrl,
      paid_at: now,
      payment_method: paymentMethod,
    }).eq('ticket_number', ticket.ticket_number)

    // Send individual email per ticket
    try {
      await sendTicketEmail({
        to: buyer.buyer_email,
        name: buyer.buyer_name,
        eventName: EVENT.name,
        eventDate: EVENT.date,
        eventLocation: EVENT.location,
        tierName: 'Entrada General',
        ticketId: ticket.ticket_number,
        ticketPageUrl: ticketUrl,
      })
    } catch (err) {
      console.error('Email error for', ticket.ticket_number, err)
    }
  }

  // Send one WhatsApp with the first ticket link
  if (buyer.buyer_phone) {
    try {
      const firstUrl = `${APP_URL}/lavida/ticket/${tickets[0].ticket_number}`
      await sendWhatsAppTicket({
        to: buyer.buyer_phone,
        name: buyer.buyer_name,
        eventName: EVENT.name,
        eventDate: EVENT.date,
        eventLocation: EVENT.location,
        ticketPageUrl: firstUrl,
        ticketId: tickets[0].ticket_number,
      })
    } catch (err) {
      console.error('WhatsApp error:', err)
    }
  }

  console.log(`✓ ${tickets.length} ticket(s) confirmed: ${safeOrderId} for ${buyer.buyer_email}`)

  // ── Enviar Excel actualizado al dueño del evento ──────────────────────────
  try {
    const { buffer, filename, totalBuyers } = await generateLavidaExcel()
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Escapar todos los campos del usuario antes de embeber en HTML
    const buyerInfo = [
      `<b>Nombre:</b> ${escapeHtml(buyer.buyer_name)}`,
      `<b>Correo:</b> ${escapeHtml(buyer.buyer_email)}`,
      `<b>Cédula:</b> ${escapeHtml(buyer.buyer_cedula ?? '-')}`,
      `<b>Teléfono:</b> ${escapeHtml(buyer.buyer_phone ?? '-')}`,
      `<b>Entradas:</b> ${tickets.length}`,
      `<b>Medio de pago:</b> ${escapeHtml(paymentMethod)}`,
    ].join('<br>')

    // Subject es plain text — sin escapar pero sin HTML
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
      attachments: [{
        filename,
        content: buffer.toString('base64'),
      }],
    })

    console.log(`📊 Excel enviado a ${OWNER_EMAIL} (${totalBuyers} compradores)`)
  } catch (analyticsErr) {
    // No fallar el webhook si el email de analytics falla
    console.error('Analytics email error:', analyticsErr)
  }

  return NextResponse.json({ received: true })
}
