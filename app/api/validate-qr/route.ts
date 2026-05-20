import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { ticketNumber, adminSecret } = await req.json()

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!ticketNumber) {
    return NextResponse.json({ error: 'ticketNumber requerido' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: ticket } = await db
    .from('lavida_tickets')
    .select('*')
    .eq('ticket_number', ticketNumber)
    .single()

  if (!ticket) {
    return NextResponse.json({ valid: false, message: 'Entrada no encontrada ❌' })
  }

  if (ticket.status === 'pending') {
    return NextResponse.json({ valid: false, message: 'Pago pendiente — no válida ⏳' })
  }

  if (ticket.status === 'used') {
    return NextResponse.json({
      valid: false,
      status: 'already_used',
      message: 'Entrada ya utilizada ⚠️',
      buyer: ticket.buyer_name,
    })
  }

  if (ticket.status === 'cancelled') {
    return NextResponse.json({ valid: false, message: 'Entrada cancelada ❌' })
  }

  // Mark as used
  await db.from('lavida_tickets').update({
    status: 'used',
    used_at: new Date().toISOString(),
  }).eq('id', ticket.id)

  return NextResponse.json({
    valid: true,
    message: '✓ Entrada válida',
    buyer: ticket.buyer_name,
  })
}
