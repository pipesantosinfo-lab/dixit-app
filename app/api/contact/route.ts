import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

// Rate limiting: máx 3 mensajes por IP por hora
const contactTimestamps = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const times = (contactTimestamps.get(ip) ?? []).filter(t => now - t < 3_600_000)
  if (times.length >= 3) return true
  contactTimestamps.set(ip, [...times, now])
  return false
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Demasiados mensajes. Intenta en una hora.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const name    = String(body.name    ?? '').trim().slice(0, 120)
  const email   = String(body.email   ?? '').trim().toLowerCase().slice(0, 254)
  const message = String(body.message ?? '').trim().slice(0, 2000)

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Nombre, correo y mensaje son obligatorios.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: 'Pipe Santos Web <entradas@pipesantos.com>',
      to:   'pipesantos93@gmail.com',
      replyTo: email,
      subject: `✉️ Nuevo mensaje de ${escapeHtml(name)}`,
      html: `
        <div style="font-family:sans-serif;color:#1a1a1a;max-width:520px">
          <h2 style="color:#8B3CF7;margin:0 0 20px">Nuevo mensaje desde pipesantos.com</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 14px;background:#f8f5ff;font-weight:600;width:90px;border-radius:6px 0 0 0">Nombre</td>
              <td style="padding:10px 14px;background:#f8f5ff;border-radius:0 6px 0 0">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:#f3f0fb;font-weight:600">Correo</td>
              <td style="padding:10px 14px;background:#f3f0fb">
                <a href="mailto:${escapeHtml(email)}" style="color:#8B3CF7">${escapeHtml(email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:#f8f5ff;font-weight:600;border-radius:0 0 0 6px;vertical-align:top">Mensaje</td>
              <td style="padding:10px 14px;background:#f8f5ff;border-radius:0 0 6px 0;white-space:pre-wrap">${escapeHtml(message)}</td>
            </tr>
          </table>
          <p style="color:#999;font-size:12px;margin-top:20px">
            Puedes responder directamente a este email — irá a <b>${escapeHtml(email)}</b>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact email error:', err)
    return NextResponse.json({ error: 'Error al enviar. Intenta de nuevo.' }, { status: 500 })
  }
}
