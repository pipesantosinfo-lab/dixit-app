import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isValidAdmin } from '@/lib/auth'

function checkAuth(req: NextRequest): boolean {
  return isValidAdmin(req)
}

/* ── GET: estado del sorteo actual + lista de participantes ──────── */

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data: raffle } = await db
    .from('raffles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!raffle) {
    return NextResponse.json({ raffle: null, entries: [] })
  }

  const { data: entries } = await db
    .from('raffle_entries')
    .select('id, ticket_number, participant_name, joined_at')
    .eq('raffle_id', raffle.id)
    .order('joined_at', { ascending: false })

  return NextResponse.json({ raffle, entries: entries ?? [] })
}

/* ── POST: crear nuevo sorteo (cierra cualquier anterior) ────────── */

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim().slice(0, 120)
  if (!name) {
    return NextResponse.json({ error: 'El sorteo necesita un nombre' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Cerrar cualquier sorteo anterior que esté en 'open' o 'closed'
  await db.from('raffles')
    .update({ status: 'finished' })
    .in('status', ['open', 'closed'])

  // Crear el nuevo
  const { data, error } = await db.from('raffles')
    .insert({ name, status: 'open' })
    .select()
    .single()

  if (error || !data) {
    console.error('raffle create error:', error)
    return NextResponse.json({ error: 'No se pudo crear el sorteo' }, { status: 500 })
  }

  return NextResponse.json({ raffle: data })
}

/* ── PATCH: cambiar estado (open -> closed, finished, etc) ───────── */

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const id = Number(body.id)
  const action = String(body.action ?? '')

  if (!id || !['close', 'finish', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const db = supabaseAdmin()

  if (action === 'delete') {
    await db.from('raffles').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  }

  const newStatus = action === 'close' ? 'closed' : 'finished'
  const { data, error } = await db.from('raffles')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }

  return NextResponse.json({ raffle: data })
}
