import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

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

  // Embed hero image from public folder
  let heroAttachment: { filename: string; content: Buffer; content_id: string } | null = null
  try {
    const heroPath = path.join(process.cwd(), 'public', 'hero.jpg')
    const heroBuffer = fs.readFileSync(heroPath)
    heroAttachment = { filename: 'evento.jpg', content: heroBuffer, content_id: 'hero-img' }
  } catch {}

  const heroSrc = heroAttachment ? 'cid:hero-img' : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu entrada — ${params.eventName}</title>
</head>
<body style="margin:0;padding:0;background:#070508;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#070508;">

  <!-- Hero image -->
  ${heroSrc ? `
  <div style="position:relative;height:220px;overflow:hidden;border-radius:0;">
    <img src="${heroSrc}" width="560" style="width:100%;height:220px;object-fit:cover;object-position:center top;display:block;" alt="${params.eventName}">
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom, rgba(7,5,8,0.2) 0%, rgba(7,5,8,0.85) 100%);"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;padding:24px 32px;">
      <p style="margin:0 0 6px;color:rgba(196,82,0,0.9);font-size:10px;letter-spacing:0.35em;text-transform:uppercase;font-family:monospace;">◆ Entrada confirmada</p>
      <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:300;letter-spacing:0.03em;">${params.eventName}</h1>
    </div>
  </div>
  ` : `
  <div style="padding:40px 32px 24px;background:linear-gradient(135deg,#0d0a14,#140e20);">
    <p style="margin:0 0 8px;color:rgba(196,82,0,0.9);font-size:10px;letter-spacing:0.35em;text-transform:uppercase;font-family:monospace;">◆ Entrada confirmada</p>
    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:300;">${params.eventName}</h1>
  </div>
  `}

  <!-- Body -->
  <div style="padding:32px;background:#070508;">

    <!-- Divider -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,60,247,0.5),rgba(196,82,0,0.3),transparent);margin-bottom:28px;"></div>

    <!-- Ticket info card -->
    <div style="background:linear-gradient(135deg,#0f0c18 0%,#140e1e 50%,#0c0a12 100%);border-radius:12px;padding:24px;margin-bottom:28px;border-left:3px solid #8B3CF7;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:monospace;width:40%;">Asistente</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:14px;text-align:right;">${params.name}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:monospace;">Fecha</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#8B3CF7;font-size:13px;text-align:right;">${params.eventDate}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:monospace;">Lugar</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);font-size:14px;text-align:right;">${params.eventLocation}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-family:monospace;">Tipo</td>
          <td style="padding:10px 0;color:rgba(196,82,0,0.9);font-size:14px;font-weight:500;text-align:right;">${params.tierName}</td>
        </tr>
      </table>
    </div>

    <!-- CTA Section -->
    <div style="background:linear-gradient(135deg,rgba(139,60,247,0.08),rgba(196,82,0,0.05));border:1px solid rgba(139,60,247,0.2);border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 6px;color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:monospace;">Tu QR está aquí</p>
      <p style="margin:0 0 20px;color:rgba(255,255,255,0.6);font-size:13px;line-height:1.6;">Presiona el botón para ver tu código QR y guarda una captura de pantalla antes del evento.</p>

      <!-- Button -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="border-radius:6px;background:linear-gradient(135deg,#8B3CF7,#7c35dd);">
            <a href="${params.ticketPageUrl}"
              style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;font-weight:500;font-family:'Helvetica Neue',Arial,sans-serif;">
              Ver mi entrada + QR →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:16px 0 0;color:rgba(255,255,255,0.2);font-size:10px;letter-spacing:0.1em;font-family:monospace;">${shortId}</p>
    </div>

    <!-- Footer -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);margin-bottom:20px;"></div>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;line-height:1.7;margin:0;text-align:center;">
      Muestra el QR en la entrada el día del evento · Válido para una persona<br>
      <span style="color:rgba(139,60,247,0.4);">Pipe Santos · pipesantos.com</span>
    </p>

  </div>
</div>
</body>
</html>`

  const attachments: { filename: string; content: Buffer; content_id: string }[] = []
  if (heroAttachment) attachments.push(heroAttachment)

  await resend.emails.send({
    from: 'Pipe Santos <entradas@pipesantos.com>',
    replyTo: 'pipesantos93@gmail.com',
    to: params.to,
    subject: `Tu entrada para ${params.eventName} ✦`,
    html,
    attachments,
  })
}
