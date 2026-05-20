import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { tierId, eventId, buyerName, buyerEmail, buyerPhone } = await req.json()

  if (!tierId || !eventId || !buyerName || !buyerEmail) {
    return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Get tier
  const { data: tier, error: tierErr } = await db
    .from('ticket_tiers')
    .select('*, events(*)')
    .eq('id', tierId)
    .single()

  if (tierErr || !tier) {
    return NextResponse.json({ error: 'Tier no encontrado' }, { status: 404 })
  }

  // Check availability
  if (tier.sold_quantity >= tier.total_quantity) {
    return NextResponse.json({ error: 'Este tier está agotado' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: tier.currency,
          product_data: {
            name: `${tier.events.name} — ${tier.name}`,
            description: tier.description || undefined,
            metadata: {
              eventId,
              tierId,
            },
          },
          unit_amount: tier.price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${appUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/event/${tier.events.slug}`,
    customer_email: buyerEmail,
    metadata: {
      tierId,
      eventId,
      buyerName,
      buyerEmail,
      buyerPhone: buyerPhone || '',
    },
  })

  return NextResponse.json({ url: session.url })
}
