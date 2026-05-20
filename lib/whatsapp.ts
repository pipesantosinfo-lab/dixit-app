// WhatsApp via Twilio Sandbox (gratis para pruebas)
// Para producción: activar número WhatsApp Business en Twilio

export async function sendWhatsAppTicket({
  to,
  name,
  eventName,
  eventDate,
  eventLocation,
  ticketPageUrl,
  ticketId,
}: {
  to: string
  name: string
  eventName: string
  eventDate: string
  eventLocation: string
  ticketPageUrl: string
  ticketId: string
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !from) {
    console.warn('WhatsApp not configured — skipping')
    return
  }

  const message = `✦ *${eventName}*

Hola ${name}, tu entrada está confirmada 🎭

📅 *${eventDate}*
📍 ${eventLocation}
🎫 ${ticketId.slice(0, 8).toUpperCase()}

Muestra tu QR en la entrada:
${ticketPageUrl}

_Nos vemos pronto._`

  const body = new URLSearchParams({
    From: from,
    To: `whatsapp:${to}`,
    Body: message,
  })

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    console.error('WhatsApp error:', err)
  }
}
