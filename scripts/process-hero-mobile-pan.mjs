import sharp from 'sharp'

/* Version "ancha" de la foto de grupo (DSC04778) para el hero movil: solo se
   fija el alto (igual al que ya se aprobo), el ancho queda completo — sin
   recorte horizontal — para que el usuario pueda paniar la imagen con
   object-position y quedarse con el encuadre que prefiera. */

const SRC = 'C:/Users/User/Desktop/claude pagina/Galeria para pagina/DSC04778.jpg'
const OUT = './public'
const V = 'pan'

async function run() {
  const m2 = sharp(SRC).resize({ height: 1334 })
  await m2.clone().jpeg({ quality: 82, progressive: true }).toFile(`${OUT}/hero-mobile-2x-${V}.jpg`)
  await m2.clone().webp({ quality: 80 }).toFile(`${OUT}/hero-mobile-2x-${V}.webp`)
  const meta2 = await m2.metadata()
  console.log(`✓ hero-mobile-2x-${V}: ${meta2.width}x1334`)

  const m3 = sharp(SRC).resize({ height: 2001 })
  await m3.clone().jpeg({ quality: 82, progressive: true }).toFile(`${OUT}/hero-mobile-3x-${V}.jpg`)
  await m3.clone().webp({ quality: 80 }).toFile(`${OUT}/hero-mobile-3x-${V}.webp`)
  const meta3 = await m3.metadata()
  console.log(`✓ hero-mobile-3x-${V}: ${meta3.width}x2001`)
}

run().catch(console.error)
