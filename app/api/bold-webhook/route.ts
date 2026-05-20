import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTicketEmail } from '@/lib/email'
import { sendWhatsAppTicket } from '@/lib/whatsapp'
import { generateQRDataURL } from '@/lib/qr'

const EVENT = {
  name: 'La vida es cule viaje',
  date: 'Sábado 22 de agosto de 2026 · 2:00 PM – 6:00 PM',
  location: 'Barranquilla, Colombia',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pipesantos.com'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Bold sends different event types — only process accepted payments
  const status = (body.status as string) || (body.data as Record<string, unknown>)?.status as string
  const orderId = (body.order_id as string) || (body.reference as string) ||
    ((body.data as Record<string, unknown>)?.order_id as string) ||
    ((body.data as Record<string, unknown>)?.reference as string)

  if (!orderId) {
    console.warn('Bold webhook: no orderId found', body)
    return NextResponse.json({ received: true })
  }

  const isAccepted = ['ACCEPTED', 'APPROVED', 'payment_accepted'].includes(status as string) ||
    body.event === 'payment_accepted'

  if (!isAccepted) {
    console.log('Bold webhook: ignoring status', status)
    return NextResponse.json({ received: true })
  }

  const db = supabaseAdmin()

  // Avoid duplicates
  const { data: existing } = await db
    .from('lavida_tickets')
    .select('id, status')
    .eq('bold_order_id', orderId)
    .single()

  if (!existing) {
    console.error('Ticket not found for order:', orderId)
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (existing.status === 'active') {
    console.log('Already processed:', orderId)
    return NextResponse.json({ received: true })
  }

  const ticketUrl = `${APP_URL}/lavida/ticket/${orderId}`
  const qrDataUrl = await generateQRDataURL(ticketUrl)

  // Mark as active
  await db.from('lavida_tickets').update({
    status: 'active',
    qr_data: ticketUrl,
    paid_at: new Date().toISOString(),
  }).eq('bold_order_id', orderId)

  // Get buyer info
  const { data: ticket } = await db
    .from('lavida_tickets')
    .select('*')
    .eq('bold_order_id', orderId)
    .single()

  if (!ticket) return NextResponse.json({ received: true })

  // Send email
  try {
    await sendTicketEmail({
      to: ticket.buyer_email,
      name: ticket.buyer_name,
      eventName: EVENT.name,
      eventDate: EVENT.date,
      eventLocation: EVENT.location,
      tierName: 'Entrada General',
      ticketId: orderId,
      qrImageUrl: qrDataUrl,
      ticketPageUrl: ticketUrl,
    })
  } catch (err) {
    console.error('Email error:', err)
  }

  // Send WhatsApp
  if (ticket.buyer_phone) {
    try {
      await sendWhatsAppTicket({
        to: ticket.buyer_phone,
        name: ticket.buyer_name,
        eventName: EVENT.name,
        eventDate: EVENT.date,
        eventLocation: EVENT.location,
        ticketPageUrl: ticketUrl,
        ticketId: orderId,
      })
    } catch (err) {
      console.error('WhatsApp error:', err)
    }
  }

  console.log(`✓ Ticket confirmed: ${orderId} for ${ticket.buyer_email}`)
  return NextResponse.json({ received: true })
}
