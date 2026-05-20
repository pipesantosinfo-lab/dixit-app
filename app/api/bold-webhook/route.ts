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

  const isAccepted = ['SALE_APPROVED', 'ACCEPTED', 'APPROVED', 'payment_accepted'].includes(eventType)

  if (!isAccepted) {
    console.log('Bold webhook: ignoring event', eventType)
    return NextResponse.json({ received: true })
  }

  const db = supabaseAdmin()

  // Find all tickets for this order
  const { data: tickets } = await db
    .from('lavida_tickets')
    .select('*')
    .like('ticket_number', `${orderId}-%`)

  if (!tickets || tickets.length === 0) {
    console.error('Tickets not found for order:', orderId)
    return NextResponse.json({ error: 'Tickets not found' }, { status: 404 })
  }

  if (tickets[0].status === 'active') {
    console.log('Already processed:', orderId)
    return NextResponse.json({ received: true })
  }

  const buyer = tickets[0]
  const now = new Date().toISOString()

  // Activate all tickets and generate QR for each
  for (const ticket of tickets) {
    const ticketUrl = `${APP_URL}/lavida/ticket/${ticket.ticket_number}`
    const qrDataUrl = await generateQRDataURL(ticketUrl)

    await db.from('lavida_tickets').update({
      status: 'active',
      qr_data: ticketUrl,
      paid_at: now,
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
        qrImageUrl: qrDataUrl,
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

  console.log(`✓ ${tickets.length} ticket(s) confirmed: ${orderId} for ${buyer.buyer_email}`)
  return NextResponse.json({ received: true })
}
