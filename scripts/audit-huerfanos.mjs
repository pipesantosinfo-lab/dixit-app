import fs from 'fs'
import path from 'path'

/* Lista los archivos de public/ que no aparecen referenciados en el código.
   Tiene en cuenta las rutas que se arman dinámicamente (los MP3 y las ondas
   del podcast salen de episodios.json, y los pósters del showreel se derivan
   del nombre del vídeo). Sólo informa: no borra nada. */

let code = ''
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (!/node_modules|\.next|\.git/.test(p)) walk(p) }
    else if (/\.(tsx?|jsx?|json|css|mjs)$/.test(e.name)) { try { code += fs.readFileSync(p, 'utf8') } catch { } }
  }
}
for (const d of ['app', 'components', 'lib', 'scripts']) { if (fs.existsSync(d)) walk(d) }
// catálogos de datos que apuntan a archivos de public
for (const f of ['public/podcast/episodios.json']) {
  if (fs.existsSync(f)) code += fs.readFileSync(f, 'utf8')
}
// los pósters del showreel se derivan del nombre del vídeo
const videos = [...code.matchAll(/preconf-\d+\.(?:mov|mp4)/g)].map((m) => m[0])
videos.forEach((v) => { code += ' ' + v.replace(/\.[^.]+$/, '') + '-poster.jpg ' })

const usados = [], huerfanos = []
let totalH = 0, totalTodo = 0
const scan = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { scan(p); continue }
    const size = fs.statSync(p).size
    totalTodo += size
    const base = e.name
    const rel = p.split(path.sep).join('/')
    if (code.includes(base)) { usados.push({ f: rel, kb: Math.round(size / 1024) }) }
    else { huerfanos.push({ f: rel, kb: Math.round(size / 1024) }); totalH += size }
  }
}
scan('public')

huerfanos.sort((a, b) => b.kb - a.kb)
console.log('TOTAL public   : ' + Math.round(totalTodo / 1024 / 1024) + ' MB')
console.log('SIN REFERENCIA : ' + Math.round(totalH / 1024 / 1024) + ' MB en ' + huerfanos.length + ' archivos')
console.log('--- sin referencia, de mayor a menor ---')
huerfanos.slice(0, 40).forEach((h) => console.log(String(h.kb).padStart(7) + ' KB  ' + h.f))
