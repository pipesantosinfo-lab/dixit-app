import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'

// Rate limit: máx 5 uploads por IP por minuto
const uploadTimestamps = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const times = (uploadTimestamps.get(ip) ?? []).filter(t => now - t < 60_000)
  if (times.length >= 5) return true
  uploadTimestamps.set(ip, [...times, now])
  return false
}

const MAX_SIZE = 6 * 1024 * 1024 // 6 MB de entrada
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const maxDuration = 30 // 30s para procesar imágenes grandes

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Demasiados uploads, espera un momento.' }, { status: 429 })
  }

  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const ticketNumber = String(form.get('ticket_number') ?? '').slice(0, 64)
  const file = form.get('photo')

  if (!ticketNumber || !/^[a-f0-9-]+$/i.test(ticketNumber)) {
    return NextResponse.json({ error: 'Entrada inválida' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Falta el archivo de foto' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'La foto es muy grande (máx 6 MB)' }, { status: 413 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WEBP.' }, { status: 415 })
  }

  const db = supabaseAdmin()

  // Verificar que el ticket existe y ya entró al evento
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
      error: 'Solo pueden subir fotos quienes ya entraron al evento (QR escaneado)',
    }, { status: 403 })
  }

  // Procesar imagen con sharp: redimensionar a 1200px max, JPEG quality 85, strip metadata
  let buffer: Buffer
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer())
    buffer = await sharp(inputBuffer)
      .rotate() // respeta orientación EXIF
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()
  } catch (err) {
    console.error('sharp error:', err)
    return NextResponse.json({ error: 'No se pudo procesar la imagen' }, { status: 500 })
  }

  // Subir a Supabase Storage (overwrite si ya había foto)
  const shortId = ticketNumber.split('-')[0]
  const path = `${shortId}.jpg`

  const { error: uploadErr } = await db.storage
    .from('event-photos')
    .upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadErr) {
    console.error('upload error:', uploadErr)
    return NextResponse.json({ error: 'Error subiendo la foto' }, { status: 500 })
  }

  const { data: pub } = db.storage.from('event-photos').getPublicUrl(path)
  // Cache-buster para que se actualice si reemplaza la foto
  const publicUrl = `${pub.publicUrl}?v=${Date.now()}`

  // Upsert en event_photos
  const { error: dbErr } = await db.from('event_photos').upsert({
    ticket_number: ticketNumber,
    uploader_name: ticket.buyer_name,
    storage_path: path,
    public_url: publicUrl,
    created_at: new Date().toISOString(),
  }, { onConflict: 'ticket_number' })

  if (dbErr) {
    console.error('db error:', dbErr)
    return NextResponse.json({ error: 'Error guardando la foto' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, public_url: publicUrl })
}
