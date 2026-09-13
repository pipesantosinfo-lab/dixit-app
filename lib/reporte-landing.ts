import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { EVENTO } from '@/lib/evento'

/**
 * Medicion de la landing /cartagena: cuantas personas entran y cuantas
 * compran. Cada visita (una por sesion de navegador) y cada toque en
 * "comprar" se guardan en analytics_events; cada 10 visitas se manda un
 * reporte al dueño con el embudo completo.
 */

const OWNER_EMAIL = 'pipesantos93@gmail.com'
export const SECCION = 'landing_cartagena'
export const OBJETIVO_CLIC = 'comprar_landing'
const CADA = 10

type Fila = { session_id: string; referrer: string | null; created_at: string }

export async function registrarVisita(p: { sessionId: string; referrer: string | null; userAgent: string | null; ipHash: string }) {
  const db = supabaseAdmin()

  // Una visita por sesion: recargar la pagina no cuenta dos veces
  const { count: yaVista } = await db
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'page_view').eq('section', SECCION).eq('session_id', p.sessionId)
  if ((yaVista ?? 0) > 0) return { nueva: false, total: null as number | null }

  await db.from('analytics_events').insert({
    session_id: p.sessionId, ip_hash: p.ipHash, event_type: 'page_view', section: SECCION,
    target: null, duration_ms: null, user_agent: p.userAgent, referrer: p.referrer,
  })

  const { count } = await db
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'page_view').eq('section', SECCION)
  const total = count ?? 0
  if (total > 0 && total % CADA === 0) {
    try { await enviarReporte(total) } catch (e) { console.error('reporte landing:', e) }
  }
  return { nueva: true, total }
}

export async function registrarClic(p: { sessionId: string; userAgent: string | null; ipHash: string }) {
  const db = supabaseAdmin()
  await db.from('analytics_events').insert({
    session_id: p.sessionId, ip_hash: p.ipHash, event_type: 'click', section: SECCION,
    target: OBJETIVO_CLIC, duration_ms: null, user_agent: p.userAgent, referrer: null,
  })
}

function origen(ref: string | null): string {
  if (!ref) return 'Directo (enlace / bio)'
  const r = ref.toLowerCase()
  if (r.includes('instagram') || r.includes('l.instagram')) return 'Instagram'
  if (r.includes('whatsapp') || r.includes('wa.me')) return 'WhatsApp'
  if (r.includes('facebook') || r.includes('fb.')) return 'Facebook'
  if (r.includes('tiktok')) return 'TikTok'
  if (r.includes('pipesantos.com')) return 'Desde pipesantos.com'
  if (r.includes('google')) return 'Google'
  try { return new URL(ref).hostname } catch { return 'Otro' }
}

export async function armarReporte() {
  const db = supabaseAdmin()
  const hace24h = new Date(Date.now() - 24 * 3600_000).toISOString()

  const [{ data: visitas }, { data: clics }, { count: compras }, { count: ordenes }] = await Promise.all([
    db.from('analytics_events').select('session_id, referrer, created_at').eq('event_type', 'page_view').eq('section', SECCION).order('created_at'),
    db.from('analytics_events').select('session_id').eq('event_type', 'click').eq('target', OBJETIVO_CLIC),
    db.from('lavida_tickets').select('id', { count: 'exact', head: true }).in('status', ['active', 'used']),
    db.from('lavida_tickets').select('id', { count: 'exact', head: true }),
  ])

  const v = (visitas ?? []) as Fila[]
  const total = v.length
  const ultimas24 = v.filter(x => x.created_at >= hace24h).length
  const sesionesConClic = new Set((clics ?? []).map(c => c.session_id)).size
  const porOrigen = new Map<string, number>()
  for (const x of v) porOrigen.set(origen(x.referrer), (porOrigen.get(origen(x.referrer)) ?? 0) + 1)
  const origenes = Array.from(porOrigen.entries()).sort((a, b) => b[1] - a[1])
  const primera = v[0]?.created_at ?? null

  return {
    total, ultimas24, sesionesConClic,
    compras: compras ?? 0,
    ordenesIniciadas: ordenes ?? 0,
    origenes, primera,
    conversion: total ? ((compras ?? 0) / total) * 100 : 0,
    tasaClic: total ? (sesionesConClic / total) * 100 : 0,
  }
}

export async function enviarReporte(total: number) {
  const r = await armarReporte()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const pct = (n: number) => n.toFixed(1).replace('.', ',') + ' %'
  const desde = r.primera ? new Date(r.primera).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', timeZone: 'America/Bogota' }) : '—'
  const filaOrigen = r.origenes.map(([o, n]) => `<tr><td style="padding:6px 0;color:#444">${o}</td><td style="padding:6px 0;text-align:right;font-weight:700">${n}</td></tr>`).join('')

  await resend.emails.send({
    from: 'Pipe Santos Entradas <entradas@pipesantos.com>',
    to: OWNER_EMAIL,
    subject: `👀 ${total} visitas a la landing · ${r.compras} entrada${r.compras === 1 ? '' : 's'} vendida${r.compras === 1 ? '' : 's'} (${pct(r.conversion)})`,
    html: `
      <div style="font-family:sans-serif;color:#1a1a1a;max-width:520px">
        <h2 style="color:#8B3CF7;margin:0 0 4px">Landing ${EVENTO.ciudad} · reporte cada ${CADA} visitas</h2>
        <p style="color:#666;font-size:13px;margin:0 0 18px">Contando desde el ${desde}</p>

        <div style="display:flex;gap:10px;margin-bottom:18px">
          <div style="flex:1;background:#f8f5ff;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:30px;font-weight:800;color:#8B3CF7">${r.total}</div>
            <div style="font-size:12px;color:#666">visitas (personas distintas)</div>
          </div>
          <div style="flex:1;background:#fff5ec;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:30px;font-weight:800;color:#e8761c">${r.compras}</div>
            <div style="font-size:12px;color:#666">entradas vendidas</div>
          </div>
          <div style="flex:1;background:#eefaf1;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:30px;font-weight:800;color:#1f9d55">${pct(r.conversion)}</div>
            <div style="font-size:12px;color:#666">compran de los que entran</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px">
          <tr><td style="padding:6px 0;color:#444">Tocaron "comprar"</td><td style="padding:6px 0;text-align:right;font-weight:700">${r.sesionesConClic} <span style="color:#888;font-weight:400">(${pct(r.tasaClic)} de las visitas)</span></td></tr>
          <tr><td style="padding:6px 0;color:#444">Iniciaron el pago (con las que abandonaron)</td><td style="padding:6px 0;text-align:right;font-weight:700">${r.ordenesIniciadas}</td></tr>
          <tr><td style="padding:6px 0;color:#444">Visitas en las últimas 24 h</td><td style="padding:6px 0;text-align:right;font-weight:700">${r.ultimas24}</td></tr>
        </table>

        <p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#888;margin:0 0 6px">De dónde llegan</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px">${filaOrigen}</table>

        <p style="color:#888;font-size:12px;margin:0;line-height:1.6">
          Una visita = una persona en una sesión del navegador (recargar no suma). Tus propias entradas a la página también cuentan.<br>
          Embudo: entran → tocan comprar → llenan el formulario → pagan. La conversión compara vendidas contra visitas.
        </p>
      </div>
    `,
  })
  console.log(`📈 reporte landing enviado: ${total} visitas, ${r.compras} compras`)
}
