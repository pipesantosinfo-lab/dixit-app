#!/usr/bin/env node
/**
 * Auditoría de seguridad de pipesantos.com — repetible.
 *
 *   npm run auditoria
 *
 * No lee el código: ataca el sitio y la base de datos desde fuera, como lo
 * haría un extraño, y compara con lo que se ve desde dentro usando la llave
 * de servicio. Termina con código 1 si algo falla, para poder engancharlo a
 * un CI algún día.
 *
 * Lecciones de la auditoría del 07/09/2026, incorporadas a propósito:
 *
 *   - NUNCA juzgar por el código HTTP solo. Supabase devolvió 400 a una
 *     subida anónima y parecía "bloqueado", pero el cuerpo decía que era el
 *     filtro de tipo de archivo: la regla de seguridad ni se había evaluado.
 *     Y devolvió 200 al listar buckets, que parecía una fuga, pero el cuerpo
 *     era []. Aquí siempre se lee el cuerpo.
 *
 *   - Una tabla vacía no demuestra nada. Para saber si RLS protege hay que
 *     comparar lo que ve un anónimo contra lo que hay de verdad.
 *
 * No escribe ni borra datos reales. La única escritura es un PNG de 1x1 que
 * intenta subir como anónimo; si el intento tuviera éxito (que sería un
 * fallo grave) lo borra enseguida con la llave de servicio.
 *
 * Requiere .env.local con las llaves. Nunca imprime ninguna.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITIO = process.env.SITIO_AUDITORIA ?? 'https://www.pipesantos.com'

const TABLAS = [
  'events', 'ticket_tiers', 'tickets', 'lavida_tickets', 'raffles',
  'raffle_entries', 'event_photos', 'photo_raffles', 'analytics_events',
]

// Rutas que el PIN del validador NO debe poder abrir. Si mañana se agrega
// una ruta de admin nueva, va aquí.
const SOLO_ADMIN = [
  '/api/admin/lavida', '/api/admin/export', '/api/admin/tickets',
  '/api/admin/gallery', '/api/admin/raffle',
]
// Rutas que el validador SÍ necesita.
const DEL_VALIDADOR = ['/api/admin/sync-tickets']

const PAGINAS_BUNDLE = ['/', '/galeria-vivo', '/admin', '/validar']

const CABECERAS = [
  'content-security-policy', 'strict-transport-security',
  'x-content-type-options', 'x-frame-options', 'referrer-policy',
]

/* ── infraestructura mínima ─────────────────────────────────────────── */

const resultados = []
const ok = (n, d) => resultados.push({ estado: 'ok', n, d })
const fallo = (n, d) => resultados.push({ estado: 'FALLO', n, d })
const aviso = (n, d) => resultados.push({ estado: 'aviso', n, d })

function leerEnv() {
  const ruta = path.join(RAIZ, '.env.local')
  if (!fs.existsSync(ruta)) {
    console.error('No encuentro .env.local en', RAIZ)
    process.exit(2)
  }
  return Object.fromEntries(
    fs.readFileSync(ruta, 'utf8')
      .split(/\r?\n/)
      .filter(l => l.includes('=') && !l.trim().startsWith('#'))
      .map(l => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
      })
  )
}

const env = leerEnv()
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICIO = env.SUPABASE_SERVICE_ROLE_KEY
const hAnon = { apikey: ANON, Authorization: `Bearer ${ANON}` }
const hServicio = { apikey: SERVICIO, Authorization: `Bearer ${SERVICIO}` }

/* ── 1. ¿Alguna llave viaja al navegador? ───────────────────────────── */

async function revisarBundle() {
  const secretos = [
    ['llave anónima de Supabase', ANON],
    ['SUPABASE_SERVICE_ROLE_KEY', SERVICIO],
    ['BOLD_SECRET_KEY', env.BOLD_SECRET_KEY],
    ['ADMIN_SECRET', env.ADMIN_SECRET],
    ['VALIDATOR_SECRET', env.VALIDATOR_SECRET],
    ['RESEND_API_KEY', env.RESEND_API_KEY],
  ].filter(([, v]) => v && v.length > 12)

  const filtradas = []
  const vistos = new Set()
  let archivos = 0

  for (const pagina of PAGINAS_BUNDLE) {
    const r = await fetch(SITIO + pagina)
    const html = await r.text()
    archivos++
    for (const [nombre, valor] of secretos) {
      if (html.includes(valor)) filtradas.push(`${nombre} en ${pagina}`)
    }
    for (const c of new Set([...html.matchAll(/\/_next\/static\/[^"'\s)]+\.js/g)].map(m => m[0]))) {
      if (vistos.has(c)) continue
      vistos.add(c)
      const cr = await fetch(SITIO + c)
      if (!cr.ok) continue
      const js = await cr.text()
      archivos++
      for (const [nombre, valor] of secretos) {
        if (js.includes(valor)) filtradas.push(`${nombre} en ${c}`)
      }
    }
  }

  if (filtradas.length) fallo('Llaves en el navegador', filtradas.join('; '))
  else ok('Llaves en el navegador', `ninguna de ${secretos.length} en ${archivos} archivos`)
}

/* ── 2. Lectura de tablas: anónimo vs. realidad ─────────────────────── */

async function contar(tabla, headers) {
  const r = await fetch(`${URL_SB}/rest/v1/${tabla}?select=*&limit=1`, {
    headers: { ...headers, Prefer: 'count=exact' },
  })
  if (r.status !== 200) return null
  const total = (r.headers.get('content-range') || '').split('/')[1]
  return total === '*' ? null : Number(total)
}

async function revisarLectura() {
  const expuestas = []
  const sinConcluir = []
  for (const t of TABLAS) {
    const real = await contar(t, hServicio)
    const publico = await contar(t, hAnon)
    if (real === 0) { sinConcluir.push(t); continue }
    if (publico === null || publico > 0) expuestas.push(`${t} (${publico} visibles de ${real})`)
  }
  if (expuestas.length) fallo('Lectura anónima de tablas', 'EXPUESTAS: ' + expuestas.join(', '))
  else ok('Lectura anónima de tablas', `${TABLAS.length - sinConcluir.length} protegidas` +
    (sinConcluir.length ? ` · vacías, no concluyentes: ${sinConcluir.join(', ')}` : ''))
}

/* ── 3. Escritura anónima en tablas ─────────────────────────────────── */

async function revisarEscritura() {
  const permiten = []
  for (const t of TABLAS) {
    const r = await fetch(`${URL_SB}/rest/v1/${t}`, {
      method: 'POST',
      headers: { ...hAnon, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: '{}',
    })
    const cuerpo = await r.text()
    // Lo que importa es el motivo, no el numero: un 400 puede ser una
    // validacion de columnas y no un rechazo por permisos.
    const rechazadoPorPermisos = /row-level security|Unauthorized|AccessDenied/i.test(cuerpo) ||
      r.status === 401 || r.status === 403
    if (!rechazadoPorPermisos) permiten.push(`${t} (HTTP ${r.status}: ${cuerpo.slice(0, 60)})`)
  }
  if (permiten.length) fallo('Escritura anónima en tablas', permiten.join('; '))
  else ok('Escritura anónima en tablas', `bloqueada en las ${TABLAS.length}`)
}

/* ── 4. Almacenamiento ──────────────────────────────────────────────── */

async function revisarAlmacenamiento() {
  // Nombres de buckets: mirar el CUERPO, no el codigo.
  const rb = await fetch(`${URL_SB}/storage/v1/bucket`, { headers: hAnon })
  const cuerpoBuckets = await rb.text()
  let listaAnon = []
  try { listaAnon = JSON.parse(cuerpoBuckets) } catch { /* no es JSON */ }
  if (Array.isArray(listaAnon) && listaAnon.length > 0) {
    fallo('Buckets visibles para anónimos', listaAnon.map(b => b.name).join(', '))
  } else {
    ok('Buckets visibles para anónimos', 'ninguno')
  }

  const rs = await fetch(`${URL_SB}/storage/v1/bucket`, { headers: hServicio })
  const buckets = rs.ok ? await rs.json() : []

  // Subida anonima con un tipo de archivo VALIDO: si se manda un .txt, el
  // filtro de mime responde antes que la regla de seguridad y el resultado
  // no significa nada.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64')
  const permiten = []
  for (const b of buckets) {
    const ruta = `_auditoria_${Date.now()}.png`
    const r = await fetch(`${URL_SB}/storage/v1/object/${b.name}/${ruta}`, {
      method: 'POST',
      headers: { ...hAnon, 'Content-Type': 'image/png' },
      body: png,
    })
    const cuerpo = await r.text()
    if (r.status === 200) {
      permiten.push(b.name)
      await fetch(`${URL_SB}/storage/v1/object/${b.name}/${ruta}`, { method: 'DELETE', headers: hServicio })
    } else if (!/row-level security|Unauthorized|AccessDenied/i.test(cuerpo)) {
      aviso(`Subida a ${b.name}`, `rechazada por otra razón, no por permisos: ${cuerpo.slice(0, 80)}`)
    }
  }
  if (permiten.length) fallo('Subida anónima al almacenamiento', 'PERMITIDA en: ' + permiten.join(', '))
  else ok('Subida anónima al almacenamiento', `bloqueada en ${buckets.length} bucket(s)`)
}

/* ── 5. Separación PIN del validador / clave de admin ───────────────── */

async function revisarCredenciales() {
  const V = env.VALIDATOR_SECRET
  const A = env.ADMIN_SECRET
  if (!V || !A) { aviso('Separación de credenciales', 'faltan VALIDATOR_SECRET o ADMIN_SECRET en .env.local'); return }

  const filtrados = []
  for (const ruta of SOLO_ADMIN) {
    const rv = await fetch(SITIO + ruta, { headers: { Authorization: `Bearer ${V}` } })
    if (rv.status !== 401) filtrados.push(`${ruta} abierta al PIN del validador (HTTP ${rv.status})`)
    const ra = await fetch(SITIO + ruta, { headers: { Authorization: `Bearer ${A}` } })
    if (ra.status !== 200) filtrados.push(`${ruta} NO responde a la clave de admin (HTTP ${ra.status})`)
  }
  for (const ruta of DEL_VALIDADOR) {
    const rv = await fetch(SITIO + ruta, { headers: { Authorization: `Bearer ${V}` } })
    if (rv.status !== 200) filtrados.push(`${ruta} deberia aceptar el PIN del validador (HTTP ${rv.status})`)
  }
  const mal = await fetch(SITIO + '/api/admin/sync-tickets', { headers: { Authorization: 'Bearer noesnada' } })
  if (mal.status !== 401) filtrados.push(`un secreto inválido devuelve HTTP ${mal.status} en vez de 401`)

  if (filtrados.length) fallo('Separación de credenciales', filtrados.join('; '))
  else ok('Separación de credenciales', `${SOLO_ADMIN.length} rutas solo-admin, ${DEL_VALIDADOR.length} compartidas`)
}

/* ── 6. Cabeceras y rutas internas ──────────────────────────────────── */

async function revisarCabeceras() {
  const r = await fetch(SITIO + '/')
  const faltan = CABECERAS.filter(c => !r.headers.get(c))
  if (faltan.length) fallo('Cabeceras de seguridad', 'faltan: ' + faltan.join(', '))
  else ok('Cabeceras de seguridad', `las ${CABECERAS.length} presentes`)

  const robots = await (await fetch(SITIO + '/robots.txt')).text()
  const sinBloquear = ['/admin', '/validar', '/api/'].filter(p => !robots.includes('Disallow: ' + p))
  if (sinBloquear.length) fallo('robots.txt', 'no bloquea: ' + sinBloquear.join(', '))
  else ok('robots.txt', 'bloquea /admin, /validar y /api/')

  for (const ruta of ['/admin', '/validar']) {
    const html = await (await fetch(SITIO + ruta)).text()
    if (!/name="robots"[^>]*noindex/.test(html)) fallo(`noindex en ${ruta}`, 'no lo encuentro en el HTML')
    else ok(`noindex en ${ruta}`, 'presente')
  }
}

/* ── 7. El sitio sigue en pie ───────────────────────────────────────── */

async function revisarSitio() {
  const rutas = ['/', '/podcast', '/privacidad', '/evento', '/galeria-vivo', '/api/gallery/photos', '/api/ticket-count']
  const caidas = []
  for (const ruta of rutas) {
    const r = await fetch(SITIO + ruta)
    if (r.status !== 200) caidas.push(`${ruta} (HTTP ${r.status})`)
  }
  if (caidas.length) fallo('El sitio responde', caidas.join(', '))
  else ok('El sitio responde', `${rutas.length} rutas en 200`)
}

/* ── main ───────────────────────────────────────────────────────────── */

console.log(`\nAuditoría de seguridad · ${SITIO}\n${'─'.repeat(64)}\n`)

await revisarBundle()
await revisarLectura()
await revisarEscritura()
await revisarAlmacenamiento()
await revisarCredenciales()
await revisarCabeceras()
await revisarSitio()

for (const r of resultados) {
  const marca = r.estado === 'ok' ? '  ok  ' : r.estado === 'aviso' ? ' aviso' : ' FALLO'
  console.log(`[${marca}] ${r.n}\n           ${r.d}`)
}

const fallos = resultados.filter(r => r.estado === 'FALLO').length
const avisos = resultados.filter(r => r.estado === 'aviso').length
console.log(`\n${'─'.repeat(64)}`)
console.log(fallos === 0
  ? `Sin fallos. ${resultados.length - avisos} comprobaciones correctas${avisos ? `, ${avisos} aviso(s)` : ''}.`
  : `${fallos} FALLO(S) — revisar arriba.`)
console.log('')
process.exit(fallos === 0 ? 0 : 1)
