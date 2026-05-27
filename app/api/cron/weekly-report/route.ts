import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { requireBearer } from '@/lib/auth'

const OWNER_EMAIL = 'pipesantos93@gmail.com'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SECTION_LABELS: Record<string, string> = {
  hero: 'Inicio (Hero)',
  sobre: 'Sobre mí',
  galeria: 'Galería',
  social: 'Redes sociales',
  libro: 'Libro',
  podcast: 'Podcast',
  testimonios: 'Testimonios',
  evento: 'Evento',
  contacto: 'Contacto',
}

const CLICK_LABELS: Record<string, string> = {
  buy_ticket: '🎟️ Comprar entrada',
  buy_book: '📚 Comprar libro',
  view_readers: '👥 Ver lectores del libro',
  send_message: '✉️ Enviar mensaje de contacto',
  play_podcast: '🎙️ Reproducir podcast',
  view_gallery: '🖼️ Abrir foto de galería',
  open_event: '🎫 Abrir modal del evento',
}

function fmtTime(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rs = s % 60
  return rs > 0 ? `${m}m ${rs}s` : `${m}m`
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function GET(req: NextRequest) {
  // Vercel Cron envía Authorization: Bearer <CRON_SECRET> — comparación timing-safe
  const denied = requireBearer(req, process.env.CRON_SECRET)
  if (denied) return denied

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const db = supabaseAdmin()
  const { data: events, error } = await db
    .from('analytics_events')
    .select('event_type, section, target, duration_ms, session_id, ip_hash, created_at')
    .gte('created_at', sevenDaysAgo.toISOString())

  if (error) {
    console.error('Weekly report query error:', error)
    return NextResponse.json({ error: 'Error consultando datos' }, { status: 500 })
  }

  const all = events ?? []
  const pageViews = all.filter(e => e.event_type === 'page_view')
  const sectionEvents = all.filter(e => e.event_type === 'section_time')
  const clicks = all.filter(e => e.event_type === 'click')

  const totalViews = pageViews.length
  const uniqueSessions = new Set(all.map(e => e.session_id)).size
  const uniqueVisitors = new Set(all.map(e => e.ip_hash).filter(Boolean)).size

  // Top secciones por nº de veces vistas
  const sectionViewCount = new Map<string, number>()
  const sectionTotalMs = new Map<string, number>()
  for (const ev of sectionEvents) {
    if (!ev.section) continue
    sectionViewCount.set(ev.section, (sectionViewCount.get(ev.section) ?? 0) + 1)
    sectionTotalMs.set(ev.section, (sectionTotalMs.get(ev.section) ?? 0) + (ev.duration_ms ?? 0))
  }
  const topByViews = Array.from(sectionViewCount.entries()).sort((a, b) => b[1] - a[1])
  const topByTime = Array.from(sectionTotalMs.entries()).sort((a, b) => b[1] - a[1])

  // Promedio de tiempo por sección
  const avgByTime = topByTime.map(([name, total]) => ({
    name,
    total,
    count: sectionViewCount.get(name) ?? 1,
    avg: total / (sectionViewCount.get(name) ?? 1),
  }))

  // Clics
  const clickCount = new Map<string, number>()
  for (const ev of clicks) {
    const key = ev.target ?? 'unknown'
    clickCount.set(key, (clickCount.get(key) ?? 0) + 1)
  }
  const topClicks = Array.from(clickCount.entries()).sort((a, b) => b[1] - a[1])

  // Tiempo total promedio por sesión
  const sessionsTime = new Map<string, number>()
  for (const ev of sectionEvents) {
    sessionsTime.set(ev.session_id, (sessionsTime.get(ev.session_id) ?? 0) + (ev.duration_ms ?? 0))
  }
  const allSessionTimes = Array.from(sessionsTime.values())
  const avgSessionTime = allSessionTimes.length > 0
    ? allSessionTimes.reduce((a, b) => a + b, 0) / allSessionTimes.length
    : 0

  // HTML email
  function row(label: string, value: string, highlight = false) {
    return `
      <tr>
        <td style="padding:10px 14px;background:${highlight ? '#f3f0fb' : '#f8f5ff'};font-weight:${highlight ? '700' : '500'};color:#444">${label}</td>
        <td style="padding:10px 14px;background:${highlight ? '#f3f0fb' : '#f8f5ff'};text-align:right;font-weight:${highlight ? '700' : '600'};color:${highlight ? '#8B3CF7' : '#1a1a1a'}">${value}</td>
      </tr>`
  }

  const topByViewsHtml = topByViews.length > 0
    ? topByViews.slice(0, 9).map(([name, count], i) => row(
        `${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}${SECTION_LABELS[name] ?? name}`,
        `${count} ${count === 1 ? 'vista' : 'vistas'}`,
        i === 0,
      )).join('')
    : `<tr><td colspan="2" style="padding:14px;color:#999;text-align:center;font-style:italic">Sin datos esta semana</td></tr>`

  const topByTimeHtml = avgByTime.length > 0
    ? avgByTime.slice(0, 9).map((s, i) => row(
        `${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}${SECTION_LABELS[s.name] ?? s.name}`,
        `${fmtTime(s.total)} <span style="color:#999;font-weight:400">· prom ${fmtTime(s.avg)}</span>`,
        i === 0,
      )).join('')
    : `<tr><td colspan="2" style="padding:14px;color:#999;text-align:center;font-style:italic">Sin datos esta semana</td></tr>`

  const topClicksHtml = topClicks.length > 0
    ? topClicks.slice(0, 8).map(([name, count]) => row(
        CLICK_LABELS[name] ?? name,
        `${count} ${count === 1 ? 'clic' : 'clics'}`,
      )).join('')
    : `<tr><td colspan="2" style="padding:14px;color:#999;text-align:center;font-style:italic">Sin clics esta semana</td></tr>`

  const html = `
<!doctype html>
<html><body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:0 auto;padding:30px 20px;color:#1a1a1a">

  <div style="text-align:center;margin-bottom:30px">
    <h1 style="font-size:24px;font-weight:300;color:#8B3CF7;margin:0 0 6px;letter-spacing:-0.5px">📊 Reporte semanal</h1>
    <p style="color:#666;font-size:14px;margin:0">pipesantos.com · ${fmtDate(sevenDaysAgo)} → ${fmtDate(now)}</p>
  </div>

  <!-- Métricas principales -->
  <div style="display:flex;gap:10px;margin-bottom:24px">
    <div style="flex:1;background:linear-gradient(135deg,#8B3CF7,#C45CFF);border-radius:12px;padding:18px;text-align:center;color:white">
      <div style="font-size:11px;opacity:0.8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Vistas</div>
      <div style="font-size:32px;font-weight:300;line-height:1">${totalViews}</div>
    </div>
    <div style="flex:1;background:#fff;border:1px solid #eee;border-radius:12px;padding:18px;text-align:center">
      <div style="font-size:11px;color:#999;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Visitantes</div>
      <div style="font-size:32px;font-weight:300;color:#1a1a1a;line-height:1">${uniqueVisitors}</div>
    </div>
    <div style="flex:1;background:#fff;border:1px solid #eee;border-radius:12px;padding:18px;text-align:center">
      <div style="font-size:11px;color:#999;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Sesiones</div>
      <div style="font-size:32px;font-weight:300;color:#1a1a1a;line-height:1">${uniqueSessions}</div>
    </div>
  </div>

  <p style="background:#fff;border:1px solid #eee;border-radius:10px;padding:14px;color:#555;font-size:13px;margin:0 0 28px;text-align:center">
    ⏱️ Tiempo promedio por sesión: <b style="color:#8B3CF7">${fmtTime(avgSessionTime)}</b>
  </p>

  <!-- Top secciones por vistas -->
  <h2 style="font-size:16px;color:#8B3CF7;margin:0 0 12px;font-weight:600">📈 Secciones más visitadas</h2>
  <table style="width:100%;border-collapse:separate;border-spacing:0 4px;margin-bottom:28px">
    ${topByViewsHtml}
  </table>

  <!-- Top secciones por tiempo -->
  <h2 style="font-size:16px;color:#8B3CF7;margin:0 0 12px;font-weight:600">⏰ Secciones donde se quedan más tiempo</h2>
  <table style="width:100%;border-collapse:separate;border-spacing:0 4px;margin-bottom:28px">
    ${topByTimeHtml}
  </table>

  <!-- Clics -->
  <h2 style="font-size:16px;color:#8B3CF7;margin:0 0 12px;font-weight:600">🖱️ Interacciones clave</h2>
  <table style="width:100%;border-collapse:separate;border-spacing:0 4px;margin-bottom:28px">
    ${topClicksHtml}
  </table>

  <p style="color:#bbb;font-size:11px;text-align:center;margin:30px 0 0;line-height:1.6">
    Reporte automático generado cada lunes a las 9:00 AM (Colombia)<br>
    Datos anonimizados (IPs hasheadas) — sin tracking de terceros
  </p>
</div>
</body></html>`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Pipe Santos Web <entradas@pipesantos.com>',
      to: OWNER_EMAIL,
      subject: `📊 Reporte semanal — ${totalViews} ${totalViews === 1 ? 'vista' : 'vistas'} · ${uniqueVisitors} ${uniqueVisitors === 1 ? 'visitante' : 'visitantes'}`,
      html,
    })
  } catch (err) {
    console.error('Weekly report email error:', err)
    return NextResponse.json({ error: 'Error enviando email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, totalViews, uniqueVisitors, uniqueSessions })
}
