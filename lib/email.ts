import { Resend } from 'resend'
import { EVENTO } from '@/lib/evento'

/** Escapa caracteres HTML especiales para evitar inyección en el cuerpo del email */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

/** Arma el HTML del correo. Separado del envio para poder previsualizarlo. */
export function renderTicketEmail(params: TicketEmailParams): { html: string; subject: string } {

  // Escapar todos los campos que provienen del usuario para prevenir HTML injection
  const safeName     = escapeHtml(params.name)
  const safeEvent    = escapeHtml(params.eventName)
  const safeDate     = escapeHtml(params.eventDate)
  const safeLocation = escapeHtml(params.eventLocation)
  const safeTier     = escapeHtml(params.tierName) // el tipo va dentro de la tarjeta; se conserva para el alt
  // ticketPageUrl es construida internamente — solo sanear atributo href
  const safeUrl      = params.ticketPageUrl.replace(/"/g, '%22')

  // El logo se carga desde el dominio. Antes iba adjunto e incrustado por
  // cid:, y Gmail lo mostraba como imagen rota encima del correo y ademas
  // dejaba un "logo.png" colgando como adjunto. Con URL absoluta Gmail lo
  // sirve por su proxy y se ve; si algun cliente bloquea imagenes remotas,
  // el alt "Pipe Santos" hace de respaldo.
  const logoSrc = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://www.pipesantos.com').replace(/\/$/, '')}/logo.png`

  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.pipesantos.com').replace(/\/$/, '')
  const flyerSrc = base + EVENTO.flyerCorreo
  // ?v= cambia cuando cambia el diseño: Gmail guarda la imagen por URL.
  const tarjetaSrc = `${base}/api/tarjeta/${encodeURIComponent(params.ticketId)}?v=2`

  /* Gmail en iPhone y Android "invierte" los correos oscuros y los vuelve
   * blancos. Dos defensas:
   *  - Cada fondo oscuro lleva ADEMAS un background-image con un gradiente
   *    del mismo color: Gmail no sabe invertir gradientes y deja el bloque
   *    (y su texto) tal cual.
   *  - El flyer va como imagen. Una imagen nunca se invierte, asi que el
   *    correo siempre abre con el poster del evento en su color real.
   * Las metas color-scheme sirven para Apple Mail y Outlook. */
  const oscuro = (color: string) => `background-color:${color};background-image:linear-gradient(${color},${color});`

  const html = `<!DOCTYPE html>
<html lang="es" style="${oscuro('#070508')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Tu entrada — ${safeEvent}</title>
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    body, table, td { ${oscuro('#070508')} }
  </style>
</head>
<body bgcolor="#070508" style="margin:0;padding:0;${oscuro('#070508')}">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#070508" style="${oscuro('#070508')}">
  <tr><td align="center" style="padding:36px 12px 40px;${oscuro('#070508')}">
  <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;${oscuro('#070508')}">

    <!-- Marca -->
    <tr><td align="center" style="padding:0 0 22px;${oscuro('#070508')}">
      <img src="${logoSrc}" width="96" alt="Pipe Santos" style="display:inline-block;width:96px;height:auto;opacity:0.92;border:0;">
    </td></tr>

    <!-- Poster del evento: una imagen no se puede invertir -->
    <tr><td align="center" style="padding:0 0 26px;${oscuro('#070508')}">
      <a href="${safeUrl}" style="text-decoration:none;">
        <img src="${flyerSrc}" width="300" alt="${safeEvent} — ${escapeHtml(EVENTO.ciudad)}, ${escapeHtml(EVENTO.fechaCorta)}"
          style="display:block;width:300px;max-width:100%;height:auto;border:0;border-radius:16px;">
      </a>
    </td></tr>

    <!-- Tarjeta de informacion: tambien imagen, generada para cada entrada
         en /api/tarjeta/[number] (ver lib/tarjeta-correo.tsx). Gmail en iPhone
         invertia el texto blanco y el titulo desaparecia. -->
    <tr><td align="center" style="padding:0 0 22px;${oscuro('#070508')}">
      <a href="${safeUrl}" style="text-decoration:none;">
        <img src="${tarjetaSrc}" width="420" alt="Entrada confirmada · ${safeEvent} · ${safeName} · ${safeDate} · ${safeLocation}"
          style="display:block;width:420px;max-width:100%;height:auto;border:0;border-radius:20px;">
      </a>
    </td></tr>

    <!-- Boton -->
    <tr><td align="center" style="padding:0 16px;${oscuro('#070508')}">
      <p style="margin:0 0 18px;color:#b8a9d4;font-size:13px;line-height:1.6;font-family:'Helvetica Neue',Arial,sans-serif;">Tu código QR está en tu entrada digital.<br>Ábrela y guarda una captura antes del evento.</p>
      <table cellpadding="0" cellspacing="0" border="0" align="center"><tr>
        <td bgcolor="#8B3CF7" style="${oscuro('#8B3CF7')}border-radius:8px;">
          <a href="${safeUrl}" style="display:inline-block;padding:17px 44px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;">Ver mi entrada digital 💛</a>
        </td>
      </tr></table>
    </td></tr>

    <!-- Pie -->
    <tr><td align="center" style="padding:26px 0 0;${oscuro('#070508')}">
      <p style="margin:0;color:#6b5c86;font-size:11px;line-height:1.9;font-family:'Courier New',Courier,monospace;">
        Muestra el QR en la entrada &middot; V&aacute;lido para una persona<br>
        <a href="${base}" style="color:#a67cff;text-decoration:none;">pipesantos.com</a>
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

  return { html, subject: `Tu entrada para ${safeEvent} ✦` }
}

export async function sendTicketEmail(params: TicketEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { html, subject } = renderTicketEmail(params)
  await resend.emails.send({
    from: 'Pipe Santos <entradas@pipesantos.com>',
    replyTo: 'pipesantos93@gmail.com',
    to: params.to,
    subject,
    html,
  })
}
