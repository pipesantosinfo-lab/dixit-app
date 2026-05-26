import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomInt } from 'crypto'

/**
 * Selecciona un ganador aleatorio del sorteo actual.
 * - El sorteo debe estar en status 'closed' (inscripciones cerradas)
 * - Usa crypto.randomInt (CSPRNG) — no Math.random
 * - Marca el sorteo como 'finished' con winner_ticket y winner_name
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const db = supabaseAdmin()

  const { data: raffle } = await db.from('raffles').select('*').eq('id', id).single()
  if (!raffle) return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 })

  if (raffle.status === 'finished' && raffle.winner_ticket) {
    // Ya hay ganador — devolverlo sin re-girar
    return NextResponse.json({
      winner_ticket: raffle.winner_ticket,
      winner_name: raffle.winner_name,
      already_finished: true,
    })
  }

  if (raffle.status === 'open') {
    return NextResponse.json({
      error: 'Primero cierra las inscripciones',
    }, { status: 400 })
  }

  // Traer participantes
  const { data: entries } = await db
    .from('raffle_entries')
    .select('ticket_number, participant_name')
    .eq('raffle_id', id)

  if (!entries || entries.length === 0) {
    return NextResponse.json({
      error: 'No hay participantes inscritos',
    }, { status: 400 })
  }

  // Selección aleatoria segura
  const idx = randomInt(0, entries.length)
  const winner = entries[idx]

  await db.from('raffles')
    .update({
      status: 'finished',
      winner_ticket: winner.ticket_number,
      winner_name: winner.participant_name,
      spun_at: new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({
    winner_ticket: winner.ticket_number,
    winner_name: winner.participant_name,
    total_participants: entries.length,
  })
}
