import { Resend } from 'resend'

interface TicketEmailParams {
  to: string
  name: string
  eventName: string
  eventDate: string
  eventLocation: string
  tierName: string
  ticketId: string
  qrImageUrl: string
  ticketPageUrl: string
}

export async function sendTicketEmail(params: TicketEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const shortId = params.ticketId.split('-')[0].toUpperCase()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu entrada — ${params.eventName}</title>
</head>
<body style="margin:0;padding:0;background:#070508;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <div style="height:1px;background:linear-gradient(90deg,transparent,#8B3CF7,#C45200,transparent);margin-bottom:40px;"></div>

    <div style="text-align:center;margin-bottom:32px;">
      <p style="color:rgba(196,82,0,0.8);font-size:11px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 12px;font-family:monospace;">◆ Entrada confirmada</p>
      <h1 style="color:#ffffff;font-size:28px;font-weight:300;letter-spacing:0.04em;margin:0;">${params.eventName}</h1>
    </div>

    <div style="background:linear-gradient(145deg,#0d0a14,#140e20);border:1px solid rgba(139,60,247,0.25);border-radius:20px;padding:32px;margin-bottom:24px;">

      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#ffffff;padding:12px;border-radius:14px;box-shadow:0 0 30px rgba(139,60,247,0.2);">
          <img src="${params.qrImageUrl}" width="180" height="180" alt="QR Ticket" style="display:block;">
        </div>
        <p style="color:rgba(255,255,255,0.2);font-size:10px;letter-spacing:0.25em;margin:12px 0 0;font-family:monospace;">${shortId}</p>
      </div>

      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,60,247,0.3),rgba(196,82,0,0.2),transparent);margin:0 0 24px;"></div>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:9px 0;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:monospace;">Asistente</td>
          <td style="padding:9px 0;color:#ffffff;font-size:14px;text-align:right;">${params.name}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:monospace;">Fecha</td>
          <td style="padding:9px 0;color:#8B3CF7;font-size:14px;text-align:right;">${params.eventDate}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:monospace;">Lugar</td>
          <td style="padding:9px 0;color:#ffffff;font-size:14px;text-align:right;">${params.eventLocation}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:monospace;">Tipo</td>
          <td style="padding:9px 0;color:rgba(196,82,0,0.9);font-size:14px;font-weight:500;text-align:right;">${params.tierName}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:36px;">
      <a href="${params.ticketPageUrl}"
        style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#8B3CF7,#a660f9);color:#ffffff;text-decoration:none;border-radius:100px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;">
        Ver mi entrada digital →
      </a>
    </div>

    <div style="text-align:center;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);margin-bottom:20px;"></div>
      <p style="color:rgba(255,255,255,0.2);font-size:11px;line-height:1.7;margin:0;">
        Muestra este QR en la entrada el día del evento.<br>
        Válido para una sola persona · No transferible.<br><br>
        <span style="color:rgba(139,60,247,0.5);">Pipe Santos · pipesantos.com</span>
      </p>
    </div>

  </div>
</body>
</html>`

  await resend.emails.send({
    from: 'Pipe Santos <onboarding@resend.dev>',
    replyTo: 'pipesantos93@gmail.com',
    to: params.to,
    subject: `Tu entrada para ${params.eventName} ✦`,
    html,
  })
}
