import fs from 'fs'
import path from 'path'
import os from 'os'

/* Recupera un archivo fuente desde un despliegue de Vercel.
   Usa la sesión que ya tiene iniciada el CLI: lee el token, lo utiliza en las
   cabeceras y nunca lo imprime ni lo guarda en ningún sitio. */

function leerToken() {
  const candidatos = [
    path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'auth.json'),
    path.join(os.homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
    path.join(os.homedir(), 'Library', 'Application Support', 'com.vercel.cli', 'auth.json'),
    path.join(os.homedir(), '.vercel', 'auth.json'),
  ]
  for (const p of candidatos) {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'))
      if (j.token) return j.token
    } catch { }
  }
  return null
}

// El token puede venir del entorno (VERCEL_TOKEN) o de la sesion del CLI.
const token = process.env.VERCEL_TOKEN || leerToken()
if (!token) { console.log('NO_TOKEN'); process.exit(2) }

const OBJETIVO = process.argv[2] || 'app/preview/page.tsx'
const DEPLOY = process.argv[3]           // url del despliegue
const H = { Authorization: `Bearer ${token}` }

const j = async (url) => {
  const r = await fetch(url, { headers: H })
  if (!r.ok) throw new Error(`${r.status} en ${url.replace(/\?.*/, '')}`)
  return r.json()
}

// equipo (los despliegues viven bajo un scope)
const equipos = await j('https://api.vercel.com/v2/teams')
const team = (equipos.teams || []).find((t) => /pipesantos/i.test(t.slug || t.name || ''))
const q = team ? `?teamId=${team.id}` : ''

const dep = await j(`https://api.vercel.com/v13/deployments/${DEPLOY}${q}`)
console.log('despliegue:', dep.url, '| estado:', dep.readyState, '| creado:', new Date(dep.createdAt).toLocaleString())

// el árbol de archivos del despliegue
const arbol = await j(`https://api.vercel.com/v6/deployments/${dep.id}/files${q}`)

let encontrado = null
const buscar = (nodos, prefijo = '') => {
  for (const n of nodos || []) {
    const ruta = prefijo ? `${prefijo}/${n.name}` : n.name
    if (n.type === 'directory') buscar(n.children, ruta)
    else if (ruta === OBJETIVO || ruta.endsWith('/' + OBJETIVO)) encontrado = { ...n, ruta }
  }
}
buscar(arbol)

if (!encontrado) { console.log('NO_ENCONTRADO:', OBJETIVO); process.exit(3) }
console.log('archivo:', encontrado.ruta, '| id:', encontrado.uid)

const r = await fetch(`https://api.vercel.com/v7/deployments/${dep.id}/files/${encontrado.uid}${q}`, { headers: H })
if (!r.ok) { console.log('ERROR_DESCARGA', r.status); process.exit(4) }
const cuerpo = await r.text()

let contenido = cuerpo
try {
  const p = JSON.parse(cuerpo)
  if (p && typeof p.data === 'string') contenido = p.data
} catch { }

const salida = process.argv[4] || 'recuperado.tsx'
fs.writeFileSync(salida, contenido)
console.log('guardado en', salida, '—', contenido.split('\n').length, 'lineas,', Math.round(contenido.length / 1024), 'KB')
