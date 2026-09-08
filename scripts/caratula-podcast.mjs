import sharp from 'sharp'
import fs from 'fs'

/* Carátula del podcast en los tamaños que pide la Media Session API: el
   teléfono elige el que mejor le encaja para la pantalla de bloqueo, la
   notificación o el centro de control. */

const ORIGEN = 'C:/Users/User/Desktop/Portada para Podcast Emprendimiento Corporativo Azul.png'
const TAMANOS = [96, 128, 192, 256, 384, 512]

const m = await sharp(ORIGEN).metadata()
console.log(`origen: ${m.width}x${m.height}\n`)

for (const t of TAMANOS) {
  const salida = `public/podcast/cover-${t}.jpg`
  await sharp(ORIGEN).resize(t, t, { fit: 'cover' }).jpeg({ quality: 86, progressive: true }).toFile(salida)
  console.log(`  cover-${t}.jpg`.padEnd(26) + `${Math.round(fs.statSync(salida).size / 1024)} KB`)
}

// la que ya usa el reproductor de la web, reemplazada por la nueva
await sharp(ORIGEN).resize(600, 600, { fit: 'cover' }).jpeg({ quality: 86, progressive: true }).toFile('public/podcast/cover.jpg')
console.log('\n  cover.jpg (web)'.padEnd(27) + `${Math.round(fs.statSync('public/podcast/cover.jpg').size / 1024)} KB`)
