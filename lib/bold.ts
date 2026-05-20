const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pipesantos.com'

export async function createBoldPaymentLink({
  orderId,
  buyerEmail,
}: {
  orderId: string
  buyerEmail: string
}) {
  const response = await fetch('https://integrations.api.bold.co/online/link/v1', {
    method: 'POST',
    headers: {
      Authorization: `x-api-key ${process.env.BOLD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount_type: 'CLOSE',
      amount: { currency: 'COP', total_amount: 40000 },
      description: 'Entrada — La vida es cule viaje',
      reference: orderId,
      callback_url: `${APP_URL}/pago-exitoso?order=${orderId}`,
      payer_email: buyerEmail,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Bold API error: ${err}`)
  }

  const data = await response.json()
  return data.payload?.url as string
}
