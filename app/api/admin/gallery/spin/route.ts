import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomInt } from 'crypto'

/**
 * Selecciona una foto al azar de la galería y la marca como ganadora.
 * Usa crypto.randomInt (CSPRNG) — no Math.random.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* opcional */ }
  const name = String(body.name ?? 'Foto ganadora').trim().slice(0, 120) || 'Foto ganadora'

  const db = supabaseAdmin()

  const { data: photos } = await db
    .from('event_photos')
    .select('id, ticket_number, uploader_name, public_url')

  if (!photos || photos.length === 0) {
    return NextResponse.json({ error: 'No hay fotos en la galería' }, { status: 400 })
  }

  const idx = randomInt(0, photos.length)
  const winner = photos[idx]

  const { data: raffle, error } = await db.from('photo_raffles').insert({
    name,
    winner_photo_id: winner.id,
    winner_ticket: winner.ticket_number,
    winner_name: winner.uploader_name,
    winner_url: winner.public_url,
    spun_at: new Date().toISOString(),
  }).select().single()

  if (error) {
    console.error('photo raffle create error:', error)
    return NextResponse.json({ error: 'No se pudo guardar el resultado' }, { status: 500 })
  }

  return NextResponse.json({
    raffle,
    winner_photo: {
      id: winner.id,
      uploader_name: winner.uploader_name,
      public_url: winner.public_url,
    },
    total_photos: photos.length,
  })
}
