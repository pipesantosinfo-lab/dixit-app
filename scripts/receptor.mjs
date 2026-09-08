import http from 'http'
import fs from 'fs'

/* Receptor temporal: el navegador, que ya tiene la sesion de Vercel abierta,
   envia aqui el contenido del archivo recuperado. Solo escucha en localhost y
   se apaga en cuanto recibe el archivo. */

const PUERTO = 4599
const DESTINO = 'recuperado-page.tsx'

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.method !== 'POST') { res.writeHead(200); res.end('listo'); return }

  let cuerpo = ''
  req.on('data', (c) => { cuerpo += c })
  req.on('end', () => {
    try {
      const texto = Buffer.from(cuerpo, 'base64').toString('utf8')
      fs.writeFileSync(DESTINO, texto)
      const n = texto.split('\n').length
      console.log(`RECIBIDO: ${n} lineas, ${Math.round(texto.length / 1024)} KB -> ${DESTINO}`)
      res.writeHead(200); res.end('ok:' + n)
      setTimeout(() => process.exit(0), 300)
    } catch (e) {
      console.log('ERROR:', e.message)
      res.writeHead(500); res.end('error')
    }
  })
})
server.listen(PUERTO, '127.0.0.1', () => console.log('escuchando en http://127.0.0.1:' + PUERTO))
