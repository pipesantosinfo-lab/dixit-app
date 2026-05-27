import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

// Formato: <uuid>-<digit(s)>
const TICKET_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d+$/i

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const ticketNumber = String(body.ticketNumber ?? '').slice(0, 64)
  if (!ticketNumber || !TICKET_RE.test(ticketNumber)) {
    return NextResponse.json({ valid: false, message: 'Número inválido ❌' })
  }

  const db = supabaseAdmin()

  const { data: ticket } = await db
    .from('lavida_tickets')
    .select('id, status, buyer_name')
    .eq('ticket_number', ticketNumber)
    .maybeSingle()

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

  // Atomic update: solo marca como usada si todavía está 'active'.
  // Si otro request concurrente la marcó primero, este UPDATE no afecta filas.
  const usedAt = new Date().toISOString()
  const { data: updated } = await db
    .from('lavida_tickets')
    .update({ status: 'used', used_at: usedAt })
    .eq('id', ticket.id)
    .eq('status', 'active')
    .select('id')
    .maybeSingle()

  if (!updated) {
    // Alguien la marcó como usada entre el SELECT y este UPDATE
    return NextResponse.json({
      valid: false,
      status: 'already_used',
      message: 'Entrada ya utilizada ⚠️',
      buyer: ticket.buyer_name,
    })
  }

  return NextResponse.json({
    valid: true,
    message: '✓ Entrada válida',
    buyer: ticket.buyer_name,
  })
}
