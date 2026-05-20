import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { ticketNumber, adminSecret } = await req.json()

  // Simple admin secret check
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!ticketNumber) {
    return NextResponse.json({ error: 'ticketNumber requerido' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: ticket, error } = await db
    .from('tickets')
    .select('*, ticket_tiers(*), events(*)')
    .eq('ticket_number', ticketNumber)
    .single()

  if (error || !ticket) {
    return NextResponse.json({
      valid: false,
      status: 'not_found',
      message: 'Entrada no encontrada',
    }, { status: 404 })
  }

  if (ticket.status === 'used') {
    return NextResponse.json({
      valid: false,
      status: 'already_used',
      message: 'Esta entrada ya fue utilizada',
      usedAt: ticket.used_at,
      buyer: ticket.buyer_name,
    })
  }

  if (ticket.status === 'cancelled') {
    return NextResponse.json({
      valid: false,
      status: 'cancelled',
      message: 'Esta entrada fue cancelada',
    })
  }

  // Mark as used
  await db
    .from('tickets')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', ticket.id)

  return NextResponse.json({
    valid: true,
    status: 'ok',
    message: '✓ Entrada válida',
    buyer: ticket.buyer_name,
    tier: ticket.ticket_tiers.name,
    event: ticket.events.name,
  })
}
