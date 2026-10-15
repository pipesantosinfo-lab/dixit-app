import { Resend } from 'resend'
import { escapeHtml } from '@/lib/email'

/**
 * Correo de cancelacion del evento.
 *
 * Mismo molde que el de la entrada (lib/email.ts): fondo oscuro con el truco
 * del gradiente para que Gmail en el telefono no lo invierta, logo por URL
 * absoluta y nada de adjuntos.
 *
 * Pide los datos bancarios completos — numero, tipo y banco — porque con solo
 * el numero una transferencia se cae o se va a la cuenta equivocada.
 *
 * Las respuestas van a pipesantos93@gmail.com (replyTo), no al buzon de
 * entradas@, que es de solo envio.
 */

const RESPUESTAS = 'pipesantos93@gmail.com'

export type CancelacionParams = {
  to: string
  nombre: string
  entradas: number
  monto: number
}

const oscuro = (c: string) => `background-color:${c};background-image:linear-gradient(${c},${c});`
const pesos = (n: number) => '$' + n.toLocaleString('es-CO')
const primerNombre = (n: string) => {
  const x = n.trim().split(/\s+/)[0] || n
  return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()
}

export function renderCancelacion(p: CancelacionParams): { html: string; subject: string } {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.pipesantos.com').replace(/\/$/, '')
  const logoSrc = `${base}/logo.png`
  const nombre = escapeHtml(primerNombre(p.nombre))
  const ent = p.entradas === 1 ? '1 entrada' : `${p.entradas} entradas`
  const sans = `'Helvetica Neue',Arial,sans-serif`

  const html = `<!DOCTYPE html>
<html lang="es" style="${oscuro('#070508')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Sobre el show del 24 de octubre</title>
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
    <tr><td align="center" style="padding:0 0 26px;${oscuro('#070508')}">
      <img src="${logoSrc}" width="96" alt="Pipe Santos" style="display:inline-block;width:96px;height:auto;opacity:0.92;border:0;">
    </td></tr>

    <!-- Mensaje -->
    <tr><td style="padding:0 20px;${oscuro('#070508')}">
      <p style="margin:0 0 18px;color:#ffffff;font-size:17px;line-height:1.6;font-family:${sans};">
        Hola ${nombre} 👋 un saludo del equipo de Pipe Santos.
      </p>
      <p style="margin:0 0 16px;color:#d9cff0;font-size:15px;line-height:1.75;font-family:${sans};">
        Les contamos a todos nuestros asistentes que el show del <strong style="color:#ffffff;">24 de octubre no podrá llevarse a cabo</strong> 🗓️ Se nos cruzó un cambio de agenda de última hora que no pudimos mover.
      </p>
      <p style="margin:0 0 22px;color:#d9cff0;font-size:15px;line-height:1.75;font-family:${sans};">
        Mil disculpas a todos nuestros asistentes por el inconveniente 🙏
      </p>
    </td></tr>

    <!-- La plata -->
    <tr><td style="padding:0 20px;${oscuro('#070508')}">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#140d22" style="${oscuro('#140d22')}border-radius:16px;">
        <tr><td style="padding:24px 24px 22px;${oscuro('#140d22')}">
          <p style="margin:0 0 6px;color:#a67cff;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-family:'Courier New',Courier,monospace;">
            Te devolvemos tu dinero
          </p>
          <p style="margin:0 0 4px;color:#ffffff;font-size:32px;font-weight:700;line-height:1.1;font-family:${sans};">
            ${pesos(p.monto)} 💸
          </p>
          <p style="margin:0 0 18px;color:#9a8cb8;font-size:13px;line-height:1.6;font-family:${sans};">
            ${ent} &middot; el 100% de lo que pagaste
          </p>
          <p style="margin:0 0 12px;color:#d9cff0;font-size:15px;line-height:1.75;font-family:${sans};">
            Para girártelo, <strong style="color:#ffffff;">responde este correo</strong> con estos cuatro datos ⚡
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:7px 0;color:#ffffff;font-size:15px;line-height:1.5;font-family:${sans};">
              <span style="color:#a67cff;">1.</span> &nbsp;Número de cuenta o Nequi
            </td></tr>
            <tr><td style="padding:7px 0;color:#ffffff;font-size:15px;line-height:1.5;font-family:${sans};">
              <span style="color:#a67cff;">2.</span> &nbsp;Tipo de cuenta <span style="color:#9a8cb8;">(ahorros o corriente)</span>
            </td></tr>
            <tr><td style="padding:7px 0;color:#ffffff;font-size:15px;line-height:1.5;font-family:${sans};">
              <span style="color:#a67cff;">3.</span> &nbsp;Banco <span style="color:#9a8cb8;">(Nequi, Bancolombia, Davivienda…)</span>
            </td></tr>
            <tr><td style="padding:7px 0;color:#ffffff;font-size:15px;line-height:1.5;font-family:${sans};">
              <span style="color:#a67cff;">4.</span> &nbsp;Nombre y cédula del titular
            </td></tr>
          </table>
          <p style="margin:14px 0 0;color:#9a8cb8;font-size:13px;line-height:1.6;font-family:${sans};">
            Con los cuatro datos completos lo giramos el mismo día. Si falta alguno, el banco rechaza la transferencia.
          </p>
        </td></tr>
      </table>
    </td></tr>

    <!-- Cierre -->
    <tr><td style="padding:24px 20px 0;${oscuro('#070508')}">
      <p style="margin:0;color:#d9cff0;font-size:15px;line-height:1.75;font-family:${sans};">
        Gracias por la confianza 🧡 Apenas tengamos nueva fecha, les contamos 🎤
      </p>
      <p style="margin:18px 0 0;color:#ffffff;font-size:15px;line-height:1.6;font-family:${sans};">
        Equipo Pipe Santos
      </p>
    </td></tr>

    <!-- Pie -->
    <tr><td align="center" style="padding:30px 0 0;${oscuro('#070508')}">
      <p style="margin:0;color:#6b5c86;font-size:11px;line-height:1.9;font-family:'Courier New',Courier,monospace;">
        Responde a este correo o escr&iacute;benos a<br>
        <a href="mailto:${RESPUESTAS}" style="color:#a67cff;text-decoration:none;">${RESPUESTAS}</a><br><br>
        <a href="${base}" style="color:#a67cff;text-decoration:none;">pipesantos.com</a>
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`

  return { html, subject: 'Sobre el show del 24 de octubre' }
}

export async function enviarCancelacion(p: CancelacionParams) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { html, subject } = renderCancelacion(p)
  return resend.emails.send({
    from: 'Pipe Santos <entradas@pipesantos.com>',
    to: p.to,
    replyTo: RESPUESTAS,
    subject,
    html,
  })
}
