import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { consultarLinkBold } from '@/lib/bold'
import { activarOrden } from '@/lib/activar-orden'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/ticket-status?order=<uuid>
 *
 * Devuelve { status: 'active' | 'pending' | 'rejected' | 'not_found' }.
 * Lo consulta /pago-exitoso cada pocos segundos cuando la persona vuelve
 * de Bold.
 *
 * Si la entrada sigue pendiente, en vez de esperar al webhook se le
 * pregunta a Bold directamente por el link de pago. Si Bold dice PAID, la
 * orden se activa aqui mismo (correo, QR, Excel). Asi la compra no depende
 * de que el webhook este registrado ni de que llegue a tiempo.
 */
export async function GET(req: NextRequest) {
  const order = (req.nextUrl.searchParams.get('order') ?? '').toLowerCase()
  if (!UUID_RE.test(order)) {
    return NextResponse.json({ status: 'not_found' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data } = await db
    .from('lavida_tickets')
    .select('status, bold_order_id')
    .eq('ticket_number', `${order}-1`)
    .maybeSingle()

  if (!data) return NextResponse.json({ status: 'not_found' })
  if (data.status === 'active') return NextResponse.json({ status: 'active' })

  // Pendiente: preguntarle a Bold
  const link = data.bold_order_id ?? ''
  if (/^LNK_/i.test(link)) {
    const bold = await consultarLinkBold(link)
    if (bold?.status === 'PAID') {
      console.log('ticket-status: Bold dice PAID, activando sin webhook', order)
      const r = await activarOrden(order, bold.paymentMethod)
      if (r.ok) return NextResponse.json({ status: 'active' })
    } else if (bold?.status === 'REJECTED' || bold?.status === 'CANCELLED' || bold?.status === 'EXPIRED') {
      return NextResponse.json({ status: 'rejected' })
    }
  }

  return NextResponse.json({ status: data.status })
}
