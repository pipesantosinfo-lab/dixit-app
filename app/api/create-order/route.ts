import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createBoldPaymentLink } from '@/lib/bold'
import { v4 as uuidv4 } from 'uuid'

const MAX_TICKETS = 340
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
  const buyerAge    = parseInt(String(body.buyerAge)) || 0
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
  if (!buyerAge || buyerAge < 18 || buyerAge > 120) {
    return NextResponse.json({ error: 'Debes tener 18 años o más para adquirir una entrada.' }, { status: 400 })
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

  /* Inventario:
   *  - 'active' / 'used'   → confirmados, siempre ocupan asiento
   *  - 'pending' RECIENTE  → ocupa asiento temporalmente (durante checkout)
   *  - 'pending' VIEJO     → checkout abandonado, NO debe ocupar asiento
   *
   * Sin este filtro, un atacante podría iniciar 300 órdenes sin pagar y
   * agotar el evento (DoS de inventario). La ventana de 30 min cubre buyers
   * lentos sin permitir abuso indefinido. */
  const PENDING_TTL_MIN = 30
  const pendingCutoff = new Date(Date.now() - PENDING_TTL_MIN * 60_000).toISOString()

  const [{ count: confirmed }, { count: pendingRecent }] = await Promise.all([
    db.from('lavida_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'used']),
    db.from('lavida_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('created_at', pendingCutoff),
  ])
  const occupied = (confirmed ?? 0) + (pendingRecent ?? 0)

  if (occupied + quantity > MAX_TICKETS) {
    return NextResponse.json({ error: `Solo quedan ${MAX_TICKETS - occupied} entradas disponibles.` }, { status: 400 })
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

  /* Post-insert race-condition check:
   * Dos requests concurrentes pueden pasar el pre-check simultáneamente e insertar
   * ambas. Después de insertar, volvemos a contar para detectar el oversell y
   * hacer rollback antes de crear el link de pago. */
  const [{ count: confirmedNow }, { count: pendingNow }] = await Promise.all([
    db.from('lavida_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'used']),
    db.from('lavida_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('created_at', pendingCutoff),
  ])
  if ((confirmedNow ?? 0) + (pendingNow ?? 0) > MAX_TICKETS) {
    // Rollback: eliminar las entradas que acabamos de insertar
    await db.from('lavida_tickets').delete().like('ticket_number', `${orderId}-%`)
    console.warn('create-order: oversell detectado, rollback para', orderId)
    return NextResponse.json(
      { error: 'Las últimas entradas acaban de venderse. Intenta de nuevo.' },
      { status: 409 }
    )
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
