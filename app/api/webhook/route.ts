import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTicketEmail } from '@/lib/email'
import { sendWhatsAppTicket } from '@/lib/whatsapp'
import { generateQRDataURL } from '@/lib/qr'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as {
    id: string
    metadata: Record<string, string>
  }

  const { tierId, eventId, buyerName, buyerEmail, buyerPhone } = session.metadata

  const db = supabaseAdmin()

  // Avoid duplicate tickets
  const { data: existing } = await db
    .from('tickets')
    .select('id')
    .eq('stripe_payment_id', session.id)
    .single()

  if (existing) {
    console.log('Ticket already created for session:', session.id)
    return NextResponse.json({ received: true })
  }

  // Get tier + event
  const { data: tier } = await db
    .from('ticket_tiers')
    .select('*, events(*)')
    .eq('id', tierId)
    .single()

  if (!tier) {
    console.error('Tier not found:', tierId)
    return NextResponse.json({ error: 'Tier not found' }, { status: 400 })
  }

  // Create unique ticket ID
  const ticketNumber = uuidv4()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const ticketUrl = `${appUrl}/ticket/${ticketNumber}`

  // Generate QR
  const qrDataUrl = await generateQRDataURL(ticketUrl)

  // Save ticket to DB
  const { error: insertErr } = await db.from('tickets').insert({
    id: uuidv4(),
    event_id: eventId,
    tier_id: tierId,
    ticket_number: ticketNumber,
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    buyer_phone: buyerPhone || null,
    stripe_payment_id: session.id,
    qr_data: ticketUrl,
    status: 'active',
  })

  if (insertErr) {
    console.error('Failed to insert ticket:', insertErr)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Increment sold count
  await db.rpc('increment_sold_quantity', { tier_id_param: tierId })

  // Send email
  try {
    await sendTicketEmail({
      to: buyerEmail,
      name: buyerName,
      eventName: tier.events.name,
      eventDate: tier.events.date,
      eventLocation: tier.events.location,
      tierName: tier.name,
      ticketId: ticketNumber,
      ticketPageUrl: ticketUrl,
    })
  } catch (emailErr) {
    console.error('Email failed:', emailErr)
    // Don't fail the webhook — ticket is already created
  }

  // Send WhatsApp (if phone provided)
  if (buyerPhone) {
    try {
      await sendWhatsAppTicket({
        to: buyerPhone,
        name: buyerName,
        eventName: tier.events.name,
        eventDate: tier.events.date,
        eventLocation: tier.events.location,
        ticketPageUrl: ticketUrl,
        ticketId: ticketNumber,
      })
    } catch (waErr) {
      console.error('WhatsApp failed:', waErr)
    }
  }

  console.log(`✓ Ticket created: ${ticketNumber} for ${buyerEmail}`)
  return NextResponse.json({ received: true })
}

// Required: disable body parsing for Stripe webhooks

