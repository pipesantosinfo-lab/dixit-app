import { NextRequest, NextResponse } from 'next/server'
import { generateQRBuffer } from '@/lib/qr'

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get('data')
  if (!data) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const buffer = await generateQRBuffer(decodeURIComponent(data))
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
