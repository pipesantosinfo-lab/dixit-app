import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createBoldPaymentLink } from '@/lib/bold'
import { v4 as uuidv4 } from 'uuid'

const MAX_TICKETS = 300
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/
const PHONE_RE = /^[+]?[\d\s()-]{6,20}$/

// Rate limiting por email + IP para que no se pueda evadir cambiando solo el email
const orderTimestamps = new Map<string, number[]>()
function isRateLimited(key: string, max = 3, windowMs = 3_600_000): boolean {
  const now = Date.now()
  const times = (orderTimestamps.get(key) ?? []).filter(t => now - t < windowMs)
  if (times.length >= max) return true
  orderTimestamps.set(key, [...times, now])
  return false
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const buyerName   = String(body.buyerName   ?? '').trim().slice(0, 120)
  const buyerEmail  = String(body.buyerEmail  ?? '').trim().toLowerCase().slice(0, 254)
  const buyerPhone  = String(body.buyerPhone  ?? '').trim().slice(0, 20) || null
  const buyerCedula = String(body.buyerCedula ?? '').replace(/\D/g, '').slice(0, 10) || null
  const quantity    = Math.min(Math.max(1, parseInt(String(body.quantity)) || 1), 10)

  if (!buyerName || !buyerEmail) {
    return NextResponse.json({ error: 'Nombre y correo son obligatorios.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(buyerEmail)) {
    return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 })
  }
  if (buyerPhone && !PHONE_RE.test(buyerPhone)) {
    return NextResponse.json({ error: 'Teléfono inválido.' }, { status: 400 })
  }
  if (buyerCedula && (buyerCedula.length < 6 || buyerCedula.length > 10)) {
    return NextResponse.json({ error: 'Cédula inválida.' }, { status: 400 })
  }
  // Rate limit por email (3/h) y por IP (10/h — más permisivo para familias en mismo wifi)
  if (isRateLimited('email:' + buyerEmail, 3)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en una hora.' }, { status: 429 })
  }
  if (isRateLimited('ip:' + ip, 10)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en una hora.' }, { status: 429 })
  }

  const db = supabaseAdmin()

  // Check availability
  const { count } = await db
    .from('lavida_tickets')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'cancelled')

  if ((count ?? 0) + quantity > MAX_TICKETS) {
    return NextResponse.json({ error: `Solo quedan ${MAX_TICKETS - (count ?? 0)} entradas disponibles.` }, { status: 400 })
  }

  const orderId = uuidv4()

  // Create one ticket record per entry; first one holds the bold_order_id for webhook lookup
  const tickets = Array.from({ length: quantity }, (_, i) => ({
    ticket_number: `${orderId}-${i + 1}`,
    buyer_name: buyerName.trim(),
    buyer_email: buyerEmail.trim().toLowerCase(),
    buyer_phone: buyerPhone?.trim() || null,
    buyer_cedula: buyerCedula || null,
    bold_order_id: i === 0 ? orderId : null,
    status: 'pending',
  }))

  const { error } = await db.from('lavida_tickets').insert(tickets)

  if (error) {
    console.error('DB insert error:', error)
    return NextResponse.json({ error: 'Error al crear el pedido. Intenta de nuevo.' }, { status: 500 })
  }

  // Create Bold payment link for the full amount
  try {
    const boldUrl = await createBoldPaymentLink({ orderId, buyerEmail: buyerEmail.trim(), quantity })
    return NextResponse.json({ url: boldUrl })
  } catch (err) {
    console.error('Bold error:', err)
    await db.from('lavida_tickets').delete().eq('buyer_email', buyerEmail.trim().toLowerCase()).eq('bold_order_id', orderId)
    await db.from('lavida_tickets').delete().like('ticket_number', `${orderId}-%`).is('bold_order_id', null)
    return NextResponse.json({ error: 'Error al conectar con el sistema de pago. Intenta de nuevo.' }, { status: 500 })
  }
}
