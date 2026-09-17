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
    .select('ticket_number, bold_order_id, status, buyer_name, buyer_email, created_at')
    .in('status', ['pending', 'cancelled'])
    .like('bold_order_id', 'LNK_%')
    .gte('created_at', desde)
    .limit(50)

  if (error) {
    console.error('reconciliar-pagos:', error.message)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }

  const activadas: string[] = []
  const alertadas: string[] = []
  let consultadas = 0
  // Ordenes ya avisadas (sin columna nueva: un JSON en el bucket config)
  const yaAvisadas = await leerAvisadas(db)
  for (const t of pendientes ?? []) {
    const bold = await consultarLinkBold(t.bold_order_id as string)
    consultadas++
    const orderId = (t.ticket_number as string).replace(/-\d+$/, '')
    if (bold?.status === 'PAID') {
      const r = await activarOrden(orderId, bold.paymentMethod)
      if (r.ok && !r.yaEstaba) {
        activadas.push(orderId)
        console.log('reconciliar-pagos: activada sin webhook', orderId, bold.paymentMethod)
      }
      continue
    }
    /* Pago atascado: Bold registro una transaccion (la persona intento pagar,
     * y con Nequi/PSE el dinero pudo salir) pero el link no quedo PAID. Paso
     * el 16/09/2026 con un Nequi de $80.000. Se avisa al dueño una sola vez
     * por orden, a los 15 min, para que revise en Bold antes de que el
     * cliente se queje. */
    const minutos = (Date.now() - new Date(t.created_at as string).getTime()) / 60_000
    if (bold?.transactionId && minutos >= 15 && !yaAvisadas.has(orderId)) {
      try {
        await avisarPagoAtascado(db, t, bold)
        yaAvisadas.add(orderId)
        await guardarAvisadas(db, yaAvisadas)
        alertadas.push(orderId)
      } catch (e) { console.error('alerta pago atascado:', e) }
    }
  }

  return NextResponse.json({ ok: true, consultadas, activadas, alertadas })
}

async function avisarPagoAtascado(
  db: ReturnType<typeof supabaseAdmin>,
  t: { ticket_number: string; bold_order_id: string; buyer_name: string; buyer_email: string; created_at: string },
  bold: { status: string; paymentMethod: string; transactionId: string | null },
) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const orderId = t.ticket_number.replace(/-\d+$/, '')
  const { count } = await db.from('lavida_tickets').select('id', { count: 'exact', head: true }).like('ticket_number', `${orderId}-%`)
  const hora = new Date(t.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })
  await resend.emails.send({
    from: 'Pipe Santos Entradas <entradas@pipesantos.com>',
    to: 'pipesantos93@gmail.com',
    subject: `⚠️ Pago atascado en Bold — ${t.buyer_name} (${count ?? 1} entrada${(count ?? 1) === 1 ? '' : 's'})`,
    html: `
      <div style="font-family:sans-serif;color:#1a1a1a;max-width:520px;line-height:1.6">
        <h2 style="color:#c4520a;margin:0 0 12px">Un pago intentado no quedó confirmado</h2>
        <p>Bold registró una transacción para esta orden, pero <b>no la marca como pagada</b>. Con Nequi o PSE el dinero pudo salir de la cuenta de la persona.</p>
        <div style="background:#fff5ec;border-radius:8px;padding:14px;margin:14px 0">
          <b>${t.buyer_name}</b><br>${t.buyer_email}<br>
          Orden creada: ${hora}<br>
          Entradas: ${count ?? 1}<br>
          Medio: ${bold.paymentMethod} · Estado del link: ${bold.status}<br>
          Transacción Bold: <b>${bold.transactionId}</b> · Link: ${t.bold_order_id}
        </div>
        <p><b>Qué hacer:</b> busca la transacción en Bold → Historial de ventas.<br>
        · Si está <b>aprobada</b>, dile a Claude "activa la orden ${orderId}" y la persona recibe su entrada.<br>
        · Si está <b>pendiente o rechazada</b>, la plata no llegó: la persona debe esperar la reversión de su banco/Nequi o volver a comprar.</p>
        <p style="color:#888;font-size:12px">Este aviso se manda una sola vez por orden. Si Bold la aprueba después, el sistema la activa solo.</p>
      </div>`,
  })
  console.log('reconciliar-pagos: alerta de pago atascado', orderId, bold.transactionId)
}

const ARCHIVO_AVISADAS = 'alertas-pago.json'
async function leerAvisadas(db: ReturnType<typeof supabaseAdmin>): Promise<Set<string>> {
  try {
    const { data } = await db.storage.from('config').download(ARCHIVO_AVISADAS)
    if (!data) return new Set()
    const j = JSON.parse(await data.text())
    return new Set(Array.isArray(j.ordenes) ? j.ordenes : [])
  } catch { return new Set() }
}
async function guardarAvisadas(db: ReturnType<typeof supabaseAdmin>, s: Set<string>) {
  const blob = new Blob([JSON.stringify({ ordenes: Array.from(s) })], { type: 'application/json' })
  await db.storage.from('config').upload(ARCHIVO_AVISADAS, blob, { upsert: true, contentType: 'application/json' })
}
