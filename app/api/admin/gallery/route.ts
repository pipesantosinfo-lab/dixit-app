import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isValidAdmin } from '@/lib/auth'

function checkAuth(req: NextRequest): boolean {
  return isValidAdmin(req)
}

/* GET: estado completo (fotos + último sorteo de foto) */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const [{ data: photos }, { data: lastRaffle }] = await Promise.all([
    db.from('event_photos')
      .select('id, ticket_number, uploader_name, public_url, created_at')
      .order('created_at', { ascending: false }),
    db.from('photo_raffles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return NextResponse.json({
    photos: photos ?? [],
    last_raffle: lastRaffle ?? null,
  })
}

/* DELETE: borrar una foto (moderación) */
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const url = new URL(req.url)
  const id = Number(url.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: photo } = await db.from('event_photos').select('storage_path').eq('id', id).maybeSingle()
  if (!photo) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  await db.storage.from('event-photos').remove([photo.storage_path])
  await db.from('event_photos').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
