/**
 * Genera public/og-image.png en proporción 1200x630 (estándar Open Graph)
 * con el logo "Pipe Santos · ● REC" centrado y un tagline debajo.
 *
 * Uso: node scripts/generate-og-image.js
 */
const sharp = require('sharp')
const path = require('path')

const W = 1200
const H = 630
const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo.png')
const OUT_PATH = path.join(__dirname, '..', 'public', 'og-image.png')

async function main() {
  // 1. Cargar el logo y redimensionarlo a un ancho cómodo
  const logoTargetWidth = 720
  const logoBuf = await sharp(LOGO_PATH)
    .resize({ width: logoTargetWidth, withoutEnlargement: false })
    .toBuffer()
  const logoMeta = await sharp(logoBuf).metadata()
  const logoH = logoMeta.height

  // 2. Posicionar el logo centrado, ligeramente por encima del medio
  const logoX = Math.round((W - logoTargetWidth) / 2)
  const logoY = Math.round((H - logoH) / 2) - 50  // 50px arriba del centro

  // 3. SVG con el tagline debajo del logo
  const taglineY = logoY + logoH + 60
  const tagline = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .tag {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 26px;
          fill: rgba(255,255,255,0.55);
          letter-spacing: 8px;
        }
      </style>
      <text x="50%" y="${taglineY}" text-anchor="middle" class="tag">
        ESCRITOR · CONFERENCISTA · INFLUENCER
      </text>
    </svg>
  `

  // 4. Componer todo sobre fondo negro
  await sharp({
    create: { width: W, height: H, channels: 4, background: '#070508' },
  })
    .composite([
      { input: logoBuf, top: logoY, left: logoX },
      { input: Buffer.from(tagline), top: 0, left: 0 },
    ])
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(OUT_PATH)

  console.log(`✓ Generado: ${OUT_PATH} (${W}x${H})`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
