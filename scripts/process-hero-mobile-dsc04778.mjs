import sharp from 'sharp'

/* Restaura la foto de grupo (DSC04778, la toma nocturna de la multitud) como
   fondo del hero en movil, en el lugar de la foto de Pipe Santos de pie que
   habia quedado puesta por error. Mismos targets y mismo pipeline que
   process-hero.mjs (fit:cover, jpg progresivo + webp); cambia el origen y la
   posicion de recorte a 'attention' porque la fuente es panoramica y hay que
   conservar el grupo de personas, no el cielo.

   Salida versionada (v10) en vez de sobrescribir los archivos sin sufijo:
   asi ni el navegador ni el CDN de Vercel sirven una copia en cache vieja. */

const SRC = 'C:/Users/User/Desktop/claude pagina/Galeria para pagina/DSC04778.jpg'
const OUT = './public'
const V = 'v11'

async function run() {
  const src = sharp(SRC)
  const { width, height } = await src.metadata()
  console.log(`Source: ${width}x${height}`)

  const m2w = 750, m2h = 1334
  const m2 = sharp(SRC).resize(m2w, m2h, { fit: 'cover', position: 'left' })
  await m2.clone().jpeg({ quality: 82, progressive: true }).toFile(`${OUT}/hero-mobile-2x-${V}.jpg`)
  await m2.clone().webp({ quality: 80 }).toFile(`${OUT}/hero-mobile-2x-${V}.webp`)
  console.log(`✓ hero-mobile-2x-${V} (.jpg + .webp)`)

  const m3w = 1125, m3h = 2001
  const m3 = sharp(SRC).resize(m3w, m3h, { fit: 'cover', position: 'left' })
  await m3.clone().jpeg({ quality: 82, progressive: true }).toFile(`${OUT}/hero-mobile-3x-${V}.jpg`)
  await m3.clone().webp({ quality: 80 }).toFile(`${OUT}/hero-mobile-3x-${V}.webp`)
  console.log(`✓ hero-mobile-3x-${V} (.jpg + .webp)`)

  console.log('\nDone.')
}

run().catch(console.error)
