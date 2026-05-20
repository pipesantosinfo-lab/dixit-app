import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createBoldPaymentLink } from '@/lib/bold'
import { v4 as uuidv4 } from 'uuid'

const MAX_TICKETS = 300

export async function POST(req: NextRequest) {
  const { buyerName, buyerEmail, buyerPhone } = await req.json()

  if (!buyerName?.trim() || !buyerEmail?.trim()) {
    return NextResponse.json({ error: 'Nombre y correo son obligatorios.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Check availability
  const { count } = await db
    .from('lavida_tickets')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'cancelled')

  if ((count ?? 0) >= MAX_TICKETS) {
    return NextResponse.json({ error: 'Lo sentimos, todas las entradas se agotaron.' }, { status: 400 })
  }

  const orderId = uuidv4()

  // Create pending ticket
  const { error } = await db.from('lavida_tickets').insert({
    ticket_number: orderId,
    buyer_name: buyerName.trim(),
    buyer_email: buyerEmail.trim().toLowerCase(),
    buyer_phone: buyerPhone?.trim() || null,
    bold_order_id: orderId,
    status: 'pending',
  })

  if (error) {
    console.error('DB insert error:', error)
    return NextResponse.json({ error: 'Error al crear el pedido. Intenta de nuevo.' }, { status: 500 })
  }

  // Create Bold payment link
  try {
    const boldUrl = await createBoldPaymentLink({ orderId, buyerEmail: buyerEmail.trim() })
    return NextResponse.json({ url: boldUrl })
  } catch (err) {
    console.error('Bold error:', err)
    // Clean up pending ticket
    await db.from('lavida_tickets').delete().eq('bold_order_id', orderId)
    return NextResponse.json({ error: 'Error al conectar con el sistema de pago. Intenta de nuevo.' }, { status: 500 })
  }
}
