import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: Number(process.env.EMAIL_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
})

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
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu entrada — ${params.eventName}</title>
</head>
<body style="margin:0;padding:0;background:#030305;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header glowing line -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,#7B68FF,#00FFD1,transparent);margin-bottom:40px;"></div>
    
    <!-- Logo / Event Name -->
    <div style="text-align:center;margin-bottom:32px;">
      <p style="color:#ffffff40;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 12px;">Experiencia confirmada</p>
      <h1 style="color:#ffffff;font-size:32px;font-weight:300;letter-spacing:0.05em;margin:0;">${params.eventName}</h1>
    </div>

    <!-- Ticket Card -->
    <div style="background:linear-gradient(135deg,#0f0f1a,#16162a);border:1px solid rgba(123,104,255,0.3);border-radius:16px;padding:32px;margin-bottom:24px;">
      
      <!-- QR Code -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#ffffff;padding:12px;border-radius:12px;">
          <img src="${params.qrImageUrl}" width="180" height="180" alt="QR Ticket" style="display:block;">
        </div>
        <p style="color:#ffffff30;font-size:10px;letter-spacing:0.2em;margin:12px 0 0;font-family:monospace;">${params.ticketId}</p>
      </div>

      <!-- Divider -->
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);margin:0 0 24px;"></div>

      <!-- Details -->
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#ffffff50;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Asistente</td>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;text-align:right;">${params.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#ffffff50;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Fecha</td>
          <td style="padding:8px 0;color:#00FFD1;font-size:14px;text-align:right;">${params.eventDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#ffffff50;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Lugar</td>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;text-align:right;">${params.eventLocation}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#ffffff50;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Tier</td>
          <td style="padding:8px 0;color:#7B68FF;font-size:14px;font-weight:500;text-align:right;">${params.tierName}</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:40px;">
      <a href="${params.ticketPageUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7B68FF,#9d8fff);color:#ffffff;text-decoration:none;border-radius:100px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
        Ver mi entrada digital
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);margin-bottom:24px;"></div>
      <p style="color:#ffffff20;font-size:11px;line-height:1.6;margin:0;">
        Muestra este QR en la entrada.<br>
        Válido para una sola persona. No transferible.
      </p>
    </div>

  </div>
</body>
</html>
  `

  await transporter.sendMail({
    from: `"${params.eventName}" <${process.env.EMAIL_FROM}>`,
    to: params.to,
    subject: `Tu entrada para ${params.eventName} ✦`,
    html,
  })
}
