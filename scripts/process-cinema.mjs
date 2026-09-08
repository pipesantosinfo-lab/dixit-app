import sharp from 'sharp'

const SRC = './public/cinema-bg.svg'
const OUT = './public'

async function run() {
  // Mobile 2x — 750×1334 portrait
  await sharp(SRC, { density: 150 })
    .resize(750, 1334, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 88, progressive: true })
    .toFile(`${OUT}/hero-mobile-2x-v6.jpg`)
  await sharp(SRC, { density: 150 })
    .resize(750, 1334, { fit: 'cover', position: 'top' })
    .webp({ quality: 85 })
    .toFile(`${OUT}/hero-mobile-2x-v6.webp`)
  console.log('✓ mobile-2x')

  // Mobile 3x — 1125×2001
  await sharp(SRC, { density: 220 })
    .resize(1125, 2001, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 88, progressive: true })
    .toFile(`${OUT}/hero-mobile-3x-v6.jpg`)
  await sharp(SRC, { density: 220 })
    .resize(1125, 2001, { fit: 'cover', position: 'top' })
    .webp({ quality: 85 })
    .toFile(`${OUT}/hero-mobile-3x-v6.webp`)
  console.log('✓ mobile-3x')

  console.log('Done.')
}

run().catch(e => { console.error('sharp SVG failed:', e.message); process.exit(1) })
