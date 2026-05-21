import { Resend } from 'resend'

interface TicketEmailParams {
  to: string
  name: string
  eventName: string
  eventDate: string
  eventLocation: string
  tierName: string
  ticketId: string
  ticketPageUrl: string
}

export async function sendTicketEmail(params: TicketEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const shortId = params.ticketId.split('-')[0].toUpperCase()

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tu entrada — ${params.eventName}</title>
</head>
<body style="margin:0;padding:0;background:#070508;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#070508;min-height:100vh;">
  <tr><td align="center" style="padding:40px 16px;">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

    <!-- Top gradient line -->
    <tr><td style="height:3px;background:linear-gradient(90deg,#8B3CF7,#C45200);border-radius:2px 2px 0 0;"></td></tr>

    <!-- Header -->
    <tr><td style="background:#0d0a14;padding:36px 36px 28px;border-left:1px solid rgba(139,60,247,0.2);border-right:1px solid rgba(139,60,247,0.2);">
      <p style="margin:0 0 10px;color:rgba(196,82,0,0.85);font-size:10px;letter-spacing:0.35em;text-transform:uppercase;font-family:monospace;">◆ Entrada confirmada</p>
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:300;font-family:'Helvetica Neue',Arial,sans-serif;letter-spacing:0.02em;">${params.eventName}</h1>
    </td></tr>

    <!-- Ticket info -->
    <tr><td style="background:#0a0812;padding:0 36px;border-left:1px solid rgba(139,60,247,0.2);border-right:1px solid rgba(139,60,247,0.2);">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:monospace;width:45%;">Asistente</td>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:14px;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;">${params.name}</td>
        </tr>
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:monospace;">Fecha</td>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#8B3CF7;font-size:13px;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;">${params.eventDate}</td>
        </tr>
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:monospace;">Lugar</td>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.65);font-size:14px;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;">${params.eventLocation}</td>
        </tr>
        <tr>
          <td style="padding:14px 0;color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:monospace;">Tipo</td>
          <td style="padding:14px 0;color:rgba(196,82,0,0.9);font-size:14px;font-weight:600;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;">${params.tierName}</td>
        </tr>
      </table>
    </td></tr>

    <!-- CTA block -->
    <tr><td style="background:#0d0a14;padding:32px 36px 36px;border-left:1px solid rgba(139,60,247,0.2);border-right:1px solid rgba(139,60,247,0.2);">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.35);font-size:12px;font-family:'Helvetica Neue',Arial,sans-serif;text-align:center;">Tu código QR está en tu entrada digital.</p>
      <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:12px;font-family:'Helvetica Neue',Arial,sans-serif;text-align:center;">Ábrela y guarda una captura de pantalla antes del evento.</p>
      <!-- Big CTA button -->
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td align="center">
          <a href="${params.ticketPageUrl}"
            style="display:inline-block;background:linear-gradient(135deg,#8B3CF7 0%,#6d28c9 100%);color:#ffffff;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;padding:16px 52px;border-radius:5px;font-family:'Helvetica Neue',Arial,sans-serif;">
            Ver mi entrada digital
          </a>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;color:rgba(255,255,255,0.15);font-size:10px;letter-spacing:0.25em;text-align:center;font-family:monospace;">${shortId}</p>
    </td></tr>

    <!-- Bottom line -->
    <tr><td style="height:3px;background:linear-gradient(90deg,#8B3CF7,rgba(196,82,0,0.5),transparent);border-radius:0 0 2px 2px;"></td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 0;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.15);font-size:11px;line-height:1.8;font-family:monospace;">
        Muestra el QR en la entrada &middot; V&aacute;lido para una persona<br>
        <span style="color:rgba(139,60,247,0.35);">Pipe Santos &middot; pipesantos.com</span>
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

  await resend.emails.send({
    from: 'Pipe Santos <entradas@pipesantos.com>',
    replyTo: 'pipesantos93@gmail.com',
    to: params.to,
    subject: `Tu entrada para ${params.eventName} ✦`,
    html,
  })
}
