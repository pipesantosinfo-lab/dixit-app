import sharp from 'sharp'
const SRC = 'C:/Users/User/Desktop/pipe libro.png'
const OUT = './public'

const { width, height } = await sharp(SRC).metadata()
console.log(`Source: ${width}x${height}`)

// Mobile 2x — portrait 750x1334
const m2 = sharp(SRC).resize(750, 1334, { fit: 'cover', position: 'top' })
await m2.clone().jpeg({ quality: 88, progressive: true }).toFile(`${OUT}/hero-mobile-2x-v9.jpg`)
await m2.clone().webp({ quality: 85 }).toFile(`${OUT}/hero-mobile-2x-v9.webp`)
console.log('✓ mobile-2x')

// Mobile 3x
const m3 = sharp(SRC).resize(1125, 2001, { fit: 'cover', position: 'top' })
await m3.clone().jpeg({ quality: 88, progressive: true }).toFile(`${OUT}/hero-mobile-3x-v9.jpg`)
await m3.clone().webp({ quality: 85 }).toFile(`${OUT}/hero-mobile-3x-v9.webp`)
console.log('✓ mobile-3x')

// Desktop 2x — landscape
const d2 = sharp(SRC).resize(2880, 1920, { fit: 'cover', position: 'centre' })
await d2.clone().jpeg({ quality: 88, progressive: true }).toFile(`${OUT}/hero-desktop-2x-v9.jpg`)
await d2.clone().webp({ quality: 85 }).toFile(`${OUT}/hero-desktop-2x-v9.webp`)
console.log('✓ desktop-2x')

console.log('Done.')
