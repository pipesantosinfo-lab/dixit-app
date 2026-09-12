import { EVENTO, DESCRIPCION_PAGO } from '@/lib/evento'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pipesantos.com'

// El mismo numero que muestra la pagina: ambos salen de lib/evento.ts.
const UNIT_PRICE = EVENTO.precio

export async function createBoldPaymentLink({
  orderId,
  buyerEmail,
  quantity = 1,
}: {
  orderId: string
  buyerEmail: string
  quantity?: number
}) {
  const apiKey = process.env.BOLD_API_KEY
  if (!apiKey) throw new Error('BOLD_API_KEY no está configurado')

  const response = await fetch('https://integrations.api.bold.co/online/link/v1', {
    method: 'POST',
    headers: {
      Authorization: `x-api-key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount_type: 'CLOSE',
      amount: { currency: 'COP', total_amount: UNIT_PRICE * quantity },
      description: DESCRIPCION_PAGO,
      reference: orderId,
      // Vence a los 45 min: un link viejo no debe poder pagarse cuando la
      // orden ya libero su cupo (create-order cuenta pendientes de 30 min).
      expiration_date: (Date.now() + 45 * 60_000) * 1_000_000, // Bold lo pide en nanosegundos
      callback_url: `${APP_URL}/pago-exitoso?order=${orderId}`,
      payer_email: buyerEmail,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Bold API error: ${err}`)
  }

  const data = await response.json()
  const url = data.payload?.url as string
  // Id del link (LNK_...). Es lo que Bold manda como referencia en el
  // webhook y lo que permite preguntarle a Bold si el link ya se pago.
  const paymentLink = (data.payload?.payment_link as string) || (url?.match(/LNK_[A-Z0-9]+/i)?.[0] ?? '')
  return { url, paymentLink }
}

/**
 * Pregunta a Bold el estado de un link de pago. Es el camino de respaldo
 * cuando el webhook no llega: si dice PAID, la orden se activa igual.
 */
export async function consultarLinkBold(paymentLink: string): Promise<{ status: string; paymentMethod: string } | null> {
  const apiKey = process.env.BOLD_API_KEY
  if (!apiKey || !/^LNK_[A-Z0-9]{4,32}$/i.test(paymentLink)) return null
  const r = await fetch(`https://integrations.api.bold.co/online/link/v1/${paymentLink.toUpperCase()}`, {
    headers: { Authorization: `x-api-key ${apiKey}` },
    cache: 'no-store',
  })
  if (!r.ok) {
    console.error('Bold: no pude consultar el link', paymentLink, r.status)
    return null
  }
  const d = await r.json()
  return { status: String(d.status ?? ''), paymentMethod: String(d.payment_method ?? 'Bold') }
}
