import { NextRequest, NextResponse } from 'next/server'
import { generateQRBuffer } from '@/lib/qr'
import { requireAdmin } from '@/lib/auth'

// Ticket number format: <uuid>-<digit(s)>
const TICKET_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d+$/i

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

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
