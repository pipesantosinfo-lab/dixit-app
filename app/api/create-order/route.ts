import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createBoldPaymentLink } from '@/lib/bold'
import { v4 as uuidv4 } from 'uuid'

const MAX_TICKETS = 300

export async function POST(req: NextRequest) {
  const { buyerName, buyerEmail, buyerPhone, quantity: rawQty } = await req.json()
  const quantity = Math.min(Math.max(1, parseInt(rawQty) || 1), 10)

  if (!buyerName?.trim() || !buyerEmail?.trim()) {
    return NextResponse.json({ error: 'Nombre y correo son obligatorios.' }, { status: 400 })
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
