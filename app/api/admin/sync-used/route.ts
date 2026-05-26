import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Recibe una lista de tickets validados offline y los marca como usados
 * en la base de datos. Detecta conflictos (mismo ticket marcado por dos
 * dispositivos) y los reporta.
 *
 * Body: { items: [{ ticket_number: string, used_at: string }] }
 * Response: { synced: number, conflicts: [{ ticket_number, existing_used_at, attempted_used_at }] }
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

  const items = Array.isArray(body.items) ? (body.items as unknown[]).slice(0, 500) : []
  if (items.length === 0) {
    return NextResponse.json({ synced: 0, conflicts: [] })
  }

  const db = supabaseAdmin()

  // Traer estado actual de esos tickets
  const ticketNumbers = items
    .map(i => (i as Record<string, unknown>)?.ticket_number)
    .filter((t): t is string => typeof t === 'string' && /^[a-f0-9-]+$/i.test(t))

  if (ticketNumbers.length === 0) {
    return NextResponse.json({ synced: 0, conflicts: [] })
  }

  const { data: existing } = await db
    .from('lavida_tickets')
    .select('ticket_number, status, used_at')
    .in('ticket_number', ticketNumbers)

  const existingMap = new Map((existing ?? []).map(t => [t.ticket_number, t]))

  const conflicts: Array<{ ticket_number: string; existing_used_at: string; attempted_used_at: string }> = []
  const toUpdate: Array<{ ticket_number: string; used_at: string }> = []

  for (const raw of items) {
    const item = raw as Record<string, unknown>
    const ticketNumber = String(item.ticket_number ?? '')
    const usedAt = String(item.used_at ?? new Date().toISOString())
    if (!ticketNumber) continue

    const existing = existingMap.get(ticketNumber)
    if (!existing) continue // ticket no existe — ignorar

    if (existing.status === 'used' && existing.used_at) {
      // Conflicto: ya estaba marcado como usado por otro dispositivo
      if (Math.abs(new Date(existing.used_at).getTime() - new Date(usedAt).getTime()) > 5000) {
        conflicts.push({
          ticket_number: ticketNumber,
          existing_used_at: existing.used_at,
          attempted_used_at: usedAt,
        })
      }
      continue // No actualizar — la primera marca gana
    }

    toUpdate.push({ ticket_number: ticketNumber, used_at: usedAt })
  }

  // Aplicar updates uno por uno (Supabase no soporta bulk update con valores distintos por fila)
  let synced = 0
  for (const u of toUpdate) {
    const { error } = await db
      .from('lavida_tickets')
      .update({ status: 'used', used_at: u.used_at })
      .eq('ticket_number', u.ticket_number)
      .eq('status', 'active') // solo si sigue activo (previene race condition)
    if (!error) synced++
  }

  return NextResponse.json({ synced, conflicts })
}
