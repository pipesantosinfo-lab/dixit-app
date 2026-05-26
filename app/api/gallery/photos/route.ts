import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Lista de fotos de la galería + estado del ticket dado (si ?ticket=XXX).
 * Endpoint público: solo devuelve campos no sensibles (no email, no cédula).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const ticketNumber = url.searchParams.get('ticket')?.slice(0, 64) ?? null

  const db = supabaseAdmin()

  const { data: photos } = await db
    .from('event_photos')
    .select('id, uploader_name, public_url, created_at, ticket_number')
    .order('created_at', { ascending: false })
    .limit(500)

  // Anonimizar ticket_number — solo mostrar shortId para que el cliente sepa si es la suya
  const safePhotos = (photos ?? []).map(p => ({
    id: p.id,
    uploader_name: p.uploader_name,
    public_url: p.public_url,
    created_at: p.created_at,
    short_id: p.ticket_number.split('-')[0],
    is_mine: ticketNumber === p.ticket_number,
  }))

  const response: Record<string, unknown> = {
    photos: safePhotos,
    total: safePhotos.length,
  }

  if (ticketNumber && /^[a-f0-9-]+$/i.test(ticketNumber)) {
    // Indicar si este ticket ya subió foto y si su QR fue escaneado
    const [{ data: own }, { data: ticket }] = await Promise.all([
      db.from('event_photos')
        .select('id, public_url')
        .eq('ticket_number', ticketNumber)
        .maybeSingle(),
      db.from('lavida_tickets')
        .select('status')
        .eq('ticket_number', ticketNumber)
        .maybeSingle(),
    ])
    response.my_photo = own ?? null
    response.ticket_used = ticket?.status === 'used'
  }

  return NextResponse.json(response)
}
