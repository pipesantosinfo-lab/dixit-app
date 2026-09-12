import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHmac, timingSafeEqual } from 'crypto'
import { activarOrden } from '@/lib/activar-orden'

/**
 * Aviso de pago de Bold. Documentacion: https://developers.bold.co/webhook
 *
 * Bold firma con HMAC-SHA256 (hex) usando la llave secreta... pero NO sobre
 * el cuerpo crudo: sobre el cuerpo convertido a Base64. Se aceptan las dos
 * variantes (Base64 como manda Bold, y cruda, que usan las pruebas propias);
 * ambas exigen conocer la llave secreta, asi que la seguridad es la misma.
 *
 * Para links de pago, data.metadata.reference trae el id del link (LNK_...),
 * no la referencia nuestra. create-order guarda ese id en bold_order_id.
 */

function verifyBoldSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.BOLD_SECRET_KEY
  if (!secret) return false
  const normalized = signature.trim().toLowerCase().replace(/^sha256=/, '')
  let recibida: Buffer
  try { recibida = Buffer.from(normalized, 'hex') } catch { return false }
  if (recibida.length === 0) return false

  const candidatas = [
    Buffer.from(rawBody, 'utf8').toString('base64'),   // como firma Bold
    rawBody,                                            // pruebas internas
  ]
  return candidatas.some(base => {
    const esperada = Buffer.from(createHmac('sha256', secret).update(base).digest('hex'), 'hex')
    return esperada.length === recibida.length && timingSafeEqual(esperada, recibida)
  })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LNK_RE = /^LNK_[A-Z0-9]{4,32}$/i

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-bold-signature') ?? req.headers.get('bold-signature')

  if (!verifyBoldSignature(rawBody, signature)) {
    console.warn('Bold webhook: firma inválida o ausente')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const data = body.data as Record<string, unknown> | undefined
  const metadata = data?.metadata as Record<string, unknown> | undefined

  const referencia = String(
    (metadata?.reference as string) ||
    (data?.reference as string) ||
    (body.reference as string) ||
    (body.order_id as string) || '',
  ).trim()

  const eventType = (body.type as string) || (body.status as string) || (body.event as string)
  const isAccepted = ['SALE_APPROVED', 'ACCEPTED', 'APPROVED', 'payment_accepted'].includes(eventType)
  if (!isAccepted) {
    console.log('Bold webhook: ignoring event', eventType, referencia)
    return NextResponse.json({ received: true })
  }

  // ── Resolver la orden: referencia nuestra (uuid) o id del link (LNK_) ──
  let orderId: string | null = null
  if (UUID_RE.test(referencia)) {
    orderId = referencia.toLowerCase()
  } else if (LNK_RE.test(referencia)) {
    const db = supabaseAdmin()
    const { data: t } = await db
      .from('lavida_tickets')
      .select('ticket_number')
      .eq('bold_order_id', referencia.toUpperCase())
      .limit(1)
      .maybeSingle()
    if (t?.ticket_number) orderId = t.ticket_number.replace(/-\d+$/, '')
  }

  if (!orderId) {
    console.error('Bold webhook: no pude resolver la orden. referencia =', referencia)
    // 404 hace que Bold reintente (15 min, 1 h, 4 h, 8 h, 24 h)
    return NextResponse.json({ error: 'Tickets not found' }, { status: 404 })
  }

  // Medio de pago, en los distintos nombres que ha usado Bold
  const payment = data?.payment as Record<string, unknown> | undefined
  const paymentMethod: string =
    (data?.payment_method as string) ||
    (payment?.payment_type as string) ||
    (payment?.payment_method as string) ||
    (payment?.method as string) ||
    (body.payment_method as string) ||
    'Bold'

  // Una vez (12/09/2026) la busqueda devolvio vacio para una entrada que si
  // existia y al minuto siguiente la encontro. Ante un vacio se reintenta
  // una vez; si sigue vacio se responde 404 y Bold reintenta el aviso.
  let resultado = await activarOrden(orderId, paymentMethod)
  if (!resultado.ok && resultado.motivo === 'no_encontrada') {
    await new Promise(r => setTimeout(r, 1500))
    resultado = await activarOrden(orderId, paymentMethod)
  }

  if (!resultado.ok) {
    console.error('Tickets not found for order:', orderId)
    return NextResponse.json({ error: 'Tickets not found' }, { status: 404 })
  }
  if (resultado.yaEstaba) console.log('Already processed:', orderId)
  return NextResponse.json({ received: true })
}
