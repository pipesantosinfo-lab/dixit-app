'use client'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

function useFloodFill(src: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const img = document.createElement('img') as HTMLImageElement
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data
      const w = canvas.width
      const h = canvas.height
      const visited = new Uint8Array(w * h)
      const queue: number[] = []
      const seed = (x: number, y: number) => {
        const idx = y * w + x
        if (visited[idx]) return
        const p = idx * 4
        if (d[p] > 235 && d[p + 1] > 235 && d[p + 2] > 235) queue.push(idx)
      }
      for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1) }
      for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y) }
      while (queue.length > 0) {
        const idx = queue.pop()!
        if (visited[idx]) continue
        visited[idx] = 1
        const p = idx * 4
        if (d[p] > 235 && d[p + 1] > 235 && d[p + 2] > 235) {
          d[p + 3] = 0
          const x = idx % w, y = Math.floor(idx / w)
          if (x > 0)     queue.push(idx - 1)
          if (x < w - 1) queue.push(idx + 1)
          if (y > 0)     queue.push(idx - w)
          if (y < h - 1) queue.push(idx + w)
        }
      }
      ctx.putImageData(imageData, 0, 0)
      setReady(true)
    }
    img.src = src
  }, [src])

  return { canvasRef, ready }
}

export default function EventoCharacter() {
  const { canvasRef, ready } = useFloodFill('/pipe-barranquilla-evento.png')

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4.0, times: [0, 0.5, 1], ease: ['easeIn', 'easeOut'] }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: 'clamp(130px, 34vw, 200px)',
            height: 'auto',
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.5s ease',
            filter: 'drop-shadow(-6px 10px 24px rgba(0,0,0,0.6))',
            display: 'block',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
