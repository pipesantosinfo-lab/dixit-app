import { NextRequest, NextResponse } from 'next/server'
import { generateQRBuffer } from '@/lib/qr'

// Ticket number format: <uuid>-<digit(s)>
const TICKET_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d+$/i

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const raw = req.nextUrl.searchParams.get('data') ?? ''
  const data = decodeURIComponent(raw).trim()

  if (!data || data.length > 500 || !TICKET_RE.test(data)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const buffer = await generateQRBuffer(data)
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, no-store',
    },
  })
}
