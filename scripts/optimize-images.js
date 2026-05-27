/**
 * Optimiza las imágenes pesadas en public/.
 * Reduce el tamaño manteniendo calidad visible.
 * Uso: node scripts/optimize-images.js
 */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const PUBLIC = path.join(__dirname, '..', 'public')

// Configuración: { archivo, ancho_max, alto_max, formato_destino, calidad }
// Solo redimensiono — la mayoría de los archivos se muestran mucho más pequeños
// de lo que su fuente.
const IMAGES = [
  // PNGs sin transparencia → JPEG (gran reducción)
  { file: 'book-cover.png', maxW: 800, format: 'png',  quality: 90 }, // se muestra a 280px
  { file: 'pipe-3d.png',    maxW: 1000, format: 'png', quality: 88 },
  { file: 'pipe-barranquilla.png', maxW: 900, format: 'png', quality: 88 },

  // PNGs con transparencia → PNG optimizado
  { file: 'boris.png',      maxW: 900, format: 'png', quality: 88 },
  { file: 'pipe-hero.png',  maxW: 1080, format: 'png', quality: 88 },
  { file: 'pipe-social.png',maxW: 500, format: 'png', quality: 90 },
  { file: 'pipe-peek.png',  maxW: 500, format: 'png', quality: 90 },
  { file: 'pipe-barranquilla-evento.png', maxW: 500, format: 'png', quality: 90 },

  // JPEGs → JPEG re-encodeado con mozjpeg
  { file: 'hero.jpg',       maxW: 2400, format: 'jpeg', quality: 82 },
  { file: 'pipe-stage.jpg', maxW: 1800, format: 'jpeg', quality: 82 },
  { file: 'pipe-crowd.jpg', maxW: 2000, format: 'jpeg', quality: 82 },

  // Avatares de testimonios → muy pequeños (display ~80px)
  { file: 't-jesus.png',    maxW: 240, format: 'png', quality: 88 },
  { file: 't-marelvis.png', maxW: 240, format: 'png', quality: 88 },
  { file: 't-isamar.png',   maxW: 240, format: 'png', quality: 88 },
  { file: 't-danilo.png',   maxW: 240, format: 'png', quality: 88 },

  // Logo de comunidad
  { file: 'comunidad-logo.png', maxW: 600, format: 'png', quality: 90 },
]

async function optimize() {
  let totalSaved = 0
  let totalBefore = 0
  let totalAfter = 0

  for (const cfg of IMAGES) {
    const inputPath = path.join(PUBLIC, cfg.file)
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠ Skipping (not found): ${cfg.file}`)
      continue
    }

    const sizeBefore = fs.statSync(inputPath).size
    totalBefore += sizeBefore

    try {
      const inputBuffer = fs.readFileSync(inputPath)
      let pipeline = sharp(inputBuffer).rotate().resize({
        width: cfg.maxW,
        height: cfg.maxH,
        fit: 'inside',
        withoutEnlargement: true,
      })

      let outputBuffer
      if (cfg.format === 'jpeg') {
        outputBuffer = await pipeline.jpeg({ quality: cfg.quality, mozjpeg: true }).toBuffer()
      } else if (cfg.format === 'png') {
        outputBuffer = await pipeline.png({
          quality: cfg.quality,
          compressionLevel: 9,
          palette: true,
          effort: 10,
        }).toBuffer()
      } else if (cfg.format === 'webp') {
        outputBuffer = await pipeline.webp({ quality: cfg.quality, effort: 6 }).toBuffer()
      }

      fs.writeFileSync(inputPath, outputBuffer)

      const sizeAfter = outputBuffer.length
      totalAfter += sizeAfter
      const saved = sizeBefore - sizeAfter
      totalSaved += saved
      const pct = ((saved / sizeBefore) * 100).toFixed(0)
      const beforeKB = (sizeBefore / 1024).toFixed(0)
      const afterKB = (sizeAfter / 1024).toFixed(0)
      console.log(`✓ ${cfg.file.padEnd(36)} ${beforeKB.padStart(5)} KB → ${afterKB.padStart(5)} KB  (-${pct}%)`)
    } catch (err) {
      console.error(`✗ ${cfg.file}:`, err.message)
    }
  }

  console.log('')
  console.log('━'.repeat(70))
  console.log(`Total antes:  ${(totalBefore / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Total ahora:  ${(totalAfter / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Ahorrado:     ${(totalSaved / 1024 / 1024).toFixed(2)} MB (${((totalSaved / totalBefore) * 100).toFixed(0)}%)`)
}

optimize().catch(err => { console.error(err); process.exit(1) })
