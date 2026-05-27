import { NextRequest, NextResponse } from 'next/server'
import { generateLavidaExcel } from '@/lib/analytics'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const { buffer, filename } = await generateLavidaExcel()

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ error: 'Error generando el Excel' }, { status: 500 })
  }
}
