import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/ticket-status?order=<uuid>
 *
 * Devuelve el estado del primer tiquete de la orden:
 *   { status: 'active' | 'pending' | 'not_found' }
 *
 * Usado por /pago-exitoso para hacer polling y confirmar que el webhook
 * de Bold activó los tiquetes antes de mostrar el enlace definitivo.
 */
export async function GET(req: NextRequest) {
  const order = req.nextUrl.searchParams.get('order') ?? ''

  if (!UUID_RE.test(order)) {
    return NextResponse.json({ status: 'not_found' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data } = await db
    .from('lavida_tickets')
    .select('status')
    .like('ticket_number', `${order}-%`)
    .limit(1)
    .single()

  if (!data) {
    return NextResponse.json({ status: 'not_found' })
  }

  return NextResponse.json({ status: data.status })
}
