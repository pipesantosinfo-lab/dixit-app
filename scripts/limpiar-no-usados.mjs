import fs from 'fs'
import path from 'path'

/* Borra de public/ los archivos que ya no se sirven a nadie: versiones viejas
   del hero que fueron reemplazadas, un vídeo que no está en la lista del
   showreel, y varios sobrantes de pruebas. La lista es explícita a propósito
   — detectar "no usados" por búsqueda de texto da falsos positivos con las
   rutas que se arman en tiempo de ejecución (las tarjetas del hero y las
   miniaturas de galería se generan así, y no deben tocarse). */

const PROTEGIDOS = [
  /^public\/hero-cards\//,          // las 5 tarjetas del hero + el micrófono
  /^public\/gallery\/thumb\//,      // miniaturas nuevas de la galería
  /-poster\.webp$/,                 // pósters nuevos del showreel
  /hero-mobile-(2|3)x-pan\./,       // hero móvil en uso
  /^public\/podcast\/audio\//,      // audios del podcast
]

const aBorrar = []
const add = (p) => { if (fs.existsSync(p)) aBorrar.push(p) }

// 1. Vídeo que no aparece en la lista del showreel
for (const f of ['preconf-5.mov', 'preconf-5.mp4', 'preconf-5-poster.jpg', 'preconf-5-poster.webp']) {
  add(`public/showreel/${f}`)
}
// 2. Versiones antiguas del hero (v2…v12), ya reemplazadas
for (const f of fs.readdirSync('public')) {
  if (/^hero-(desktop|mobile)-\dx(-v\d+)?\.(jpg|webp)$/.test(f)) {
    if (!/-pan\./.test(f) && /-v\d+\./.test(f)) add(`public/${f}`)
  }
}
// las de nombre "base" que quedaron sin uso al pasar al recorte -pan
for (const f of ['hero-mobile-2x.jpg', 'hero-mobile-2x.webp', 'hero-mobile-3x.jpg', 'hero-mobile-3x.webp',
                 'hero-desktop-2x.jpg', 'hero-desktop-2x.webp', '_hero-source.jpg']) {
  add(`public/${f}`)
}
// 3. Sobrantes sueltos
for (const f of ['evento-flyer-v2.jpg', 'ticket-design.jpg', 'logo-pipe-white.png', 'boris.png', 'boris.webp']) {
  add(`public/${f}`)
}
add('public/podcast/ondas.json')
// 4. Fotos que no están en la lista de la galería
for (const f of ['IMG_0223.jpg', 'IMG_0261-2.jpg', 'IMG_8760.jpg']) {
  add(`public/gallery/${f}`)
  add(`public/gallery/thumb/${f.replace(/\.[^.]+$/, '')}.webp`)
}
// 5. Fotos del libro y variantes de marcas que no se muestran
for (let i = 1; i <= 5; i++) add(`public/libro/libro-foto-${i}.jpg`)
for (const f of ['all-logos.png', 'row-1.png', 'row-2.png', 'row-3.png', 'row-4.png']) {
  add(`public/marcas/${f}`)
}

let total = 0, n = 0
for (const f of aBorrar) {
  const rel = f.split(path.sep).join('/')
  if (PROTEGIDOS.some((re) => re.test(rel))) { console.log('PROTEGIDO, no se toca: ' + rel); continue }
  const kb = fs.statSync(f).size / 1024
  total += kb; n++
  fs.unlinkSync(f)
  console.log(String(Math.round(kb)).padStart(7) + ' KB  ' + rel)
}
console.log('─'.repeat(56))
console.log(`Borrados ${n} archivos — ${Math.round(total / 1024)} MB liberados`)
