import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireBearer } from '@/lib/auth'
import { consultarLinkBold } from '@/lib/bold'
import { activarOrden } from '@/lib/activar-orden'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cada minuto: para cada orden pendiente le pregunta a Bold si su link ya
 * esta PAID y, si es asi, la activa (QR, correo, Excel).
 *
 * Por que existe: con PSE, Bold deja al comprador en su pantalla
 * "Confirmando tu pago" (no lo devuelve a la pagina) y su webhook tarda
 * entre 6 y 15 minutos. Con esto la entrada llega en menos de un minuto
 * desde que el banco confirma, sin que la persona tenga que hacer nada.
 *
 * Lo dispara un cron externo (pg_cron en Supabase) con
 * Authorization: Bearer <CRON_SECRET>. Vercel Hobby solo permite crons
 * diarios, por eso no va en vercel.json.
 */
export async function GET(req: NextRequest) {
  const denied = requireBearer(req, process.env.CRON_SECRET)
  if (denied) return denied

  const db = supabaseAdmin()
  const desde = new Date(Date.now() - 48 * 3600_000).toISOString()
  const { data: pendientes, error } = await db
    .from('lavida_tickets')
    .select('ticket_number, bold_order_id, status')
    .in('status', ['pending', 'cancelled'])
    .like('bold_order_id', 'LNK_%')
    .gte('created_at', desde)
    .limit(50)

  if (error) {
    console.error('reconciliar-pagos:', error.message)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }

  const activadas: string[] = []
  let consultadas = 0
  for (const t of pendientes ?? []) {
    const bold = await consultarLinkBold(t.bold_order_id as string)
    consultadas++
    if (bold?.status === 'PAID') {
      const orderId = (t.ticket_number as string).replace(/-\d+$/, '')
      const r = await activarOrden(orderId, bold.paymentMethod)
      if (r.ok && !r.yaEstaba) {
        activadas.push(orderId)
        console.log('reconciliar-pagos: activada sin webhook', orderId, bold.paymentMethod)
      }
    }
  }

  return NextResponse.json({ ok: true, consultadas, activadas })
}
