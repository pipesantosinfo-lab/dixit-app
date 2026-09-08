import { spawnSync } from 'child_process'
import ffmpeg from 'ffmpeg-static'
import fs from 'fs'

/* Los vídeos del showreel venían con el bitrate de cámara (~11 Mbps, y uno a
   23). A esa tasa el navegador no alcanza a descargar tan rápido como
   reproduce en una conexión móvil normal, y el vídeo se queda cargando.
   CRF 23 baja el peso ~65% manteniendo la resolución 1080×1920 intacta
   (SSIM 0.985 frente al original: la diferencia no es visible).

   De paso salen todos como .mp4: la mitad eran .mov, un contenedor que
   Chrome sólo reproduce por tolerancia al declararlo como mp4. */

const DIR = 'public/showreel'
const fuentes = fs.readdirSync(DIR).filter((f) => /^preconf-\d+\.(mov|mp4)$/.test(f))

let antes = 0, despues = 0
for (const f of fuentes) {
  const src = `${DIR}/${f}`
  const base = f.replace(/\.[^.]+$/, '')
  const dst = `${DIR}/${base}-web.mp4`
  process.stdout.write(`  ${f.padEnd(16)} `)
  const t0 = Date.now()
  const r = spawnSync(ffmpeg, [
    '-y', '-i', src,
    '-c:v', 'libx264', '-crf', '23', '-preset', 'slow',
    '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',          // el vídeo empieza a verse sin bajarlo entero
    '-c:a', 'aac', '-b:a', '128k',
    dst,
  ], { encoding: 'utf8', maxBuffer: 1e8 })
  if (r.status !== 0 || !fs.existsSync(dst)) {
    console.log('ERROR\n' + (r.stderr || '').split('\n').slice(-6).join('\n'))
    continue
  }
  const a = fs.statSync(src).size, b = fs.statSync(dst).size
  antes += a; despues += b
  console.log(`${(a / 1024 / 1024).toFixed(1).padStart(5)}MB → ${(b / 1024 / 1024).toFixed(1).padStart(5)}MB  (−${Math.round((1 - b / a) * 100)}%)  ${Math.round((Date.now() - t0) / 1000)}s`)
}
console.log('─'.repeat(60))
console.log(`TOTAL  ${(antes / 1024 / 1024).toFixed(0)} MB → ${(despues / 1024 / 1024).toFixed(0)} MB  (−${Math.round((1 - despues / antes) * 100)}%)`)
