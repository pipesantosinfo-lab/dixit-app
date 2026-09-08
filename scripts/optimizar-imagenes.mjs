import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

/* Genera versiones ligeras de las imágenes que la página sirve mucho más
   grandes de lo que llega a mostrar. No reemplaza los originales: los deja
   intactos para el lightbox (donde la foto sí se ve a pantalla completa) y
   crea aparte la versión que usan la rejilla y el carrusel. */

const ok = (p) => { fs.mkdirSync(path.dirname(p), { recursive: true }) }
let antes = 0, despues = 0
const linea = (etq, a, d) => {
  antes += a; despues += d
  console.log(`  ${etq.padEnd(34)} ${String(Math.round(a / 1024)).padStart(5)}KB → ${String(Math.round(d / 1024)).padStart(4)}KB  (−${Math.round((1 - d / a) * 100)}%)`)
}

// ── 1. Galería: la rejilla la muestra a ~280px, el carrusel a ~300px.
//    640px de ancho cubre ambos con holgura incluso en pantallas retina.
console.log('\nGalería (miniaturas para la rejilla y el carrusel):')
const galeria = fs.readdirSync('public/gallery').filter((f) => /\.(jpe?g|png)$/i.test(f))
for (const f of galeria) {
  const src = `public/gallery/${f}`
  const out = `public/gallery/thumb/${f.replace(/\.[^.]+$/, '')}.webp`
  ok(out)
  await sharp(src).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out)
  linea(f, fs.statSync(src).size, fs.statSync(out).size)
}

// ── 2. Pósters del showreel: el vídeo se ve en una tarjeta de 260px de ancho,
//    y los pósters venían a 2160×3840 (resolución de grabación).
console.log('\nPósters del showreel:')
const posters = fs.readdirSync('public/showreel').filter((f) => /-poster\.jpg$/i.test(f))
for (const f of posters) {
  const src = `public/showreel/${f}`
  const out = `public/showreel/${f.replace(/\.jpg$/i, '')}.webp`
  await sharp(src).resize({ width: 620, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out)
  linea(f, fs.statSync(src).size, fs.statSync(out).size)
}

// ── 3. PNG que no necesitan serlo: son fotos/ilustraciones opacas o con
//    transparencia simple, donde WebP pesa una fracción.
console.log('\nPNG e imágenes sueltas:')
const sueltas = [
  ['public/pipe-mic.png', 'public/pipe-mic.webp', 900],
  ['public/boris.png', 'public/boris.webp', 900],
  ['public/marcas/logos-mejor.png', 'public/marcas/logos-mejor.webp', 1400],
  ['public/showreel-poster.jpg', 'public/showreel-poster.webp', 1280],
  ['public/theater-bg.jpg', 'public/theater-bg.webp', 1600],
]
for (const [src, out, w] of sueltas) {
  if (!fs.existsSync(src)) continue
  await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out)
  linea(path.basename(src), fs.statSync(src).size, fs.statSync(out).size)
}

console.log('\n' + '─'.repeat(60))
console.log(`TOTAL  ${Math.round(antes / 1024 / 1024 * 100) / 100} MB → ${Math.round(despues / 1024 / 1024 * 100) / 100} MB   (−${Math.round((1 - despues / antes) * 100)}%)`)
