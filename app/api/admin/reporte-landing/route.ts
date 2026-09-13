import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { armarReporte, enviarReporte } from '@/lib/reporte-landing'

export const dynamic = 'force-dynamic'

/** GET: devuelve el embudo de la landing. Con ?enviar=1 ademas lo manda al correo del dueño. */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const r = await armarReporte()
  if (req.nextUrl.searchParams.get('enviar') === '1') await enviarReporte(r.total)
  return NextResponse.json(r)
}
