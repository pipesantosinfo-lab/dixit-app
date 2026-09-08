import sharp from 'sharp'
import path from 'path'

const SRC = 'C:/Users/User/Desktop/claude pagina/nuevas fotos/IMG_0294.jpg'
const OUT = './public'

// IMG_0294: 2974 x 5287 (portrait)
// Mobile: portrait crop, top-focused (face usually in upper half)
// Desktop: landscape crop, center slice

async function run() {
  const src = sharp(SRC)
  const { width, height } = await src.metadata()
  console.log(`Source: ${width}x${height}`)

  // ── Mobile 2x (750 × 1334 — iPhone display) ──────────────────────────
  const m2w = 750, m2h = 1334
  const m2 = sharp(SRC).resize(m2w, m2h, { fit: 'cover', position: 'top' })
  await m2.clone().jpeg({ quality: 82, progressive: true }).toFile(`${OUT}/hero-mobile-2x.jpg`)
  await m2.clone().webp({ quality: 80 }).toFile(`${OUT}/hero-mobile-2x.webp`)
  console.log('✓ hero-mobile-2x (.jpg + .webp)')

  // ── Mobile 3x (1125 × 2001) ──────────────────────────────────────────
  const m3w = 1125, m3h = 2001
  const m3 = sharp(SRC).resize(m3w, m3h, { fit: 'cover', position: 'top' })
  await m3.clone().jpeg({ quality: 82, progressive: true }).toFile(`${OUT}/hero-mobile-3x.jpg`)
  await m3.clone().webp({ quality: 80 }).toFile(`${OUT}/hero-mobile-3x.webp`)
  console.log('✓ hero-mobile-3x (.jpg + .webp)')

  // ── Desktop 2x (2880 × 1920 — landscape crop center) ─────────────────
  // Portrait 2974×5287 → landscape: take full width, crop vertically at center-top area
  // Center y at 40% height (slightly above middle to capture subject)
  const dw = 2880, dh = 1920
  const cropH = Math.round(width * (dh / dw))   // how tall the crop window is at full width
  const cropY = Math.round(height * 0.15)        // start at 15% from top
  const d2 = sharp(SRC)
    .extract({ left: 0, top: cropY, width, height: Math.min(cropH, height - cropY) })
    .resize(dw, dh, { fit: 'cover' })
  await d2.clone().jpeg({ quality: 85, progressive: true }).toFile(`${OUT}/hero-desktop-2x.jpg`)
  await d2.clone().webp({ quality: 82 }).toFile(`${OUT}/hero-desktop-2x.webp`)
  console.log('✓ hero-desktop-2x (.jpg + .webp)')

  console.log('\nDone.')
}

run().catch(console.error)
