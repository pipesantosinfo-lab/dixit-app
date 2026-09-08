import sharp from 'sharp'
import fs from 'fs'

/* Imagen de vista previa para cuando el sitio se comparte (WhatsApp, redes).
   Es el logo de la cabecera sobre el fondo de la marca: el logo viene en
   blanco con transparencia, asi que necesita un fondo oscuro debajo. */

const W = 1200, H = 630

const fondo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="luz" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="#2A1550"/>
      <stop offset="55%" stop-color="#120B1E"/>
      <stop offset="100%" stop-color="#070508"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="#8B3CF7" stop-opacity=".30"/>
      <stop offset="100%" stop-color="#8B3CF7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#luz)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
  <circle cx="${W / 2}" cy="${H * 0.845}" r="3.5" fill="#8B3CF7" opacity=".9"/>
  <rect x="${W / 2 - 130}" y="${H * 0.845 - 0.5}" width="104" height="1" fill="#8B3CF7" opacity=".45"/>
  <rect x="${W / 2 + 26}" y="${H * 0.845 - 0.5}" width="104" height="1" fill="#8B3CF7" opacity=".45"/>
</svg>`)

const anchoLogo = 620
const logo = await sharp('public/logo-header-v2.png')
  .resize({ width: anchoLogo })
  .toBuffer()
const mLogo = await sharp(logo).metadata()

await sharp(fondo)
  .composite([{
    input: logo,
    left: Math.round((W - anchoLogo) / 2),
    top: Math.round(H * 0.42 - mLogo.height / 2),
  }])
  .jpeg({ quality: 90, progressive: true, chromaSubsampling: '4:4:4' })
  .toFile('public/og-pipe-santos.jpg')

const kb = Math.round(fs.statSync('public/og-pipe-santos.jpg').size / 1024)
console.log(`og-pipe-santos.jpg — ${W}x${H}, ${kb} KB`)
