import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Devuelve el estado del sorteo actual (más reciente).
 * Endpoint público — los asistentes lo consultan cada 5s desde su ticket page.
 *
 * Si se pasa ?ticket=<number>, también incluye:
 *  - has_joined: si ese ticket ya está inscrito
 *  - is_winner:  si ese ticket fue el ganador
 *  - ticket_used: si el QR ya fue escaneado (requisito para participar)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const ticketNumber = url.searchParams.get('ticket')?.slice(0, 64) ?? null

  const db = supabaseAdmin()

  const { data: raffle } = await db
    .from('raffles')
    .select('id, name, status, winner_ticket, winner_name')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!raffle) {
    return NextResponse.json({ raffle: null })
  }

  // Conteo de participantes
  const { count } = await db
    .from('raffle_entries')
    .select('id', { count: 'exact', head: true })
    .eq('raffle_id', raffle.id)

  const response: Record<string, unknown> = {
    raffle: {
      id: raffle.id,
      name: raffle.name,
      status: raffle.status,
      winner_name: raffle.status === 'finished' ? raffle.winner_name : null,
      participants_count: count ?? 0,
    },
  }

  if (ticketNumber && /^[a-f0-9-]+$/i.test(ticketNumber)) {
    const [{ data: joined }, { data: ticket }] = await Promise.all([
      db.from('raffle_entries')
        .select('id')
        .eq('raffle_id', raffle.id)
        .eq('ticket_number', ticketNumber)
        .maybeSingle(),
      db.from('lavida_tickets')
        .select('status')
        .eq('ticket_number', ticketNumber)
        .maybeSingle(),
    ])

    response.has_joined = !!joined
    response.is_winner = raffle.status === 'finished' && raffle.winner_ticket === ticketNumber
    response.ticket_used = ticket?.status === 'used'
  }

  return NextResponse.json(response)
}
