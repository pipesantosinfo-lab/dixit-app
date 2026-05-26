import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Rate limit básico: máx 10 intentos por IP por minuto
const joinTimestamps = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const times = (joinTimestamps.get(ip) ?? []).filter(t => now - t < 60_000)
  if (times.length >= 10) return true
  joinTimestamps.set(ip, [...times, now])
  return false
}

/**
 * El asistente confirma su participación en el sorteo activo.
 * Solo permite participar si:
 *   1. Hay un sorteo en status 'open'
 *   2. El ticket existe y su status es 'used' (ya entró al evento)
 *   3. No está ya inscrito en este sorteo
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Demasiados intentos, espera un momento.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const ticketNumber = String(body.ticket_number ?? '').slice(0, 64)
  if (!ticketNumber || !/^[a-f0-9-]+$/i.test(ticketNumber)) {
    return NextResponse.json({ error: 'Número de entrada inválido' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // 1. Hay sorteo activo (más reciente con status='open')?
  const { data: raffle } = await db
    .from('raffles')
    .select('id, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!raffle) {
    return NextResponse.json({ error: 'No hay sorteo activo' }, { status: 404 })
  }
  if (raffle.status !== 'open') {
    return NextResponse.json({ error: 'Las inscripciones ya están cerradas' }, { status: 409 })
  }

  // 2. Ticket existe y ya entró al evento?
  const { data: ticket } = await db
    .from('lavida_tickets')
    .select('ticket_number, buyer_name, status')
    .eq('ticket_number', ticketNumber)
    .maybeSingle()

  if (!ticket) {
    return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
  }
  if (ticket.status !== 'used') {
    return NextResponse.json({
      error: 'Solo pueden participar quienes ya entraron al evento (QR escaneado)',
    }, { status: 403 })
  }

  // 3. Inscribir (UNIQUE constraint maneja el duplicado)
  const { error } = await db.from('raffle_entries').insert({
    raffle_id: raffle.id,
    ticket_number: ticketNumber,
    participant_name: ticket.buyer_name,
  })

  if (error) {
    // Código '23505' = unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, already_joined: true })
    }
    console.error('raffle/join insert error:', error)
    return NextResponse.json({ error: 'No se pudo inscribir' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, raffle_id: raffle.id })
}
