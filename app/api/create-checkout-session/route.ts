import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

// Rate limiting: max 5 checkout sessions per email por hora
const checkoutTimestamps = new Map<string, number[]>()
function isRateLimited(email: string): boolean {
  const now = Date.now()
  const times = (checkoutTimestamps.get(email) ?? []).filter(t => now - t < 3_600_000)
  if (times.length >= 5) return true
  checkoutTimestamps.set(email, [...times, now])
  return false
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const tierId     = String(body.tierId     ?? '').trim().slice(0, 36)
  const eventId    = String(body.eventId    ?? '').trim().slice(0, 36)
  const buyerName  = String(body.buyerName  ?? '').trim().slice(0, 120)
  const buyerEmail = String(body.buyerEmail ?? '').trim().toLowerCase().slice(0, 254)
  const buyerPhone = String(body.buyerPhone ?? '').trim().slice(0, 20) || ''

  if (!tierId || !eventId || !buyerName || !buyerEmail) {
    return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
  }
  if (!EMAIL_RE.test(buyerEmail)) {
    return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 })
  }
  if (isRateLimited(buyerEmail)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en una hora.' }, { status: 429 })
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
