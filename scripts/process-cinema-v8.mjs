import sharp from 'sharp'
const SRC = './public/cinema-bg.svg'
const OUT = './public'

const tasks = [
  { out: 'hero-mobile-2x-v8', w: 750,  h: 1334, d: 150 },
  { out: 'hero-mobile-3x-v8', w: 1125, h: 2001, d: 220 },
  { out: 'hero-desktop-2x-v8', w: 2880, h: 1920, d: 300 },
]

for (const { out, w, h, d } of tasks) {
  const s = sharp(SRC, { density: d }).resize(w, h, { fit: 'cover', position: 'centre' })
  await s.clone().jpeg({ quality: 88, progressive: true }).toFile(`${OUT}/${out}.jpg`)
  await s.clone().webp({ quality: 85 }).toFile(`${OUT}/${out}.webp`)
  console.log(`✓ ${out}`)
}
console.log('Done.')
