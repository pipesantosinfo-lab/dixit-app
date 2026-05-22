'use client'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

/** Elimina el fondo blanco externo del PNG via canvas flood-fill */
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
        if (d[p] > 210 && d[p + 1] > 210 && d[p + 2] > 210) queue.push(idx)
      }
      for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1) }
      for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y) }
      while (queue.length > 0) {
        const idx = queue.pop()!
        if (visited[idx]) continue
        visited[idx] = 1
        const p = idx * 4
        if (d[p] > 210 && d[p + 1] > 210 && d[p + 2] > 210) {
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

const borisMessages = [
  'al cesar lo que es del cesar',
  '¿Tienes jugo de mango por ahí?',
  'Hola, mi nombre es boris',
]

export default function BorisCharacter() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [showBubble, setShowBubble] = useState(false)
  const controls = useAnimationControls()
  const { canvasRef, ready } = useFloodFill('/boris.png')
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = async () => {
    // Cancela el auto-hide anterior
    if (hideTimer.current) clearTimeout(hideTimer.current)

    setShowBubble(false)
    // Pequeño delay para que AnimatePresence haga el exit si ya había burbuja
    await new Promise(r => setTimeout(r, 80))
    setMsgIndex(i => (i + 1) % borisMessages.length)
    setShowBubble(true)

    // Shake
    controls.start({
      x: [0, -7, 4, -4, 0],
      transition: { duration: 0.38, ease: 'easeInOut' },
    })

    // Auto-ocultar después de 3.5s
    hideTimer.current = setTimeout(() => setShowBubble(false), 3500)
  }

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])

  return (
    <div className="relative cursor-pointer select-none" onClick={handleClick}>

      {/* Burbuja de texto — aparece ARRIBA del personaje (estilo cómic) */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1,   y: 0 }}
            exit={{   opacity: 0, scale: 0.85, y: 6 }}
            transition={{ duration: 0.22 }}
            className="absolute z-30 px-3 py-2 rounded-2xl text-xs font-body font-medium text-white pointer-events-none"
            style={{
              bottom: 'calc(100% + 14px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'max-content',
              maxWidth: 200,
              background: 'rgba(139,60,247,0.18)',
              border: '1px solid rgba(139,60,247,0.55)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 24px rgba(139,60,247,0.28)',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            {borisMessages[msgIndex]}
            {/* Flecha apuntando hacia abajo (hacia Boris) */}
            <div
              className="absolute -bottom-[9px] left-1/2 w-4 h-4"
              style={{
                transform: 'translateX(-50%) rotate(135deg)',
                background: 'rgba(139,60,247,0.18)',
                borderRight: '1px solid rgba(139,60,247,0.55)',
                borderTop:   '1px solid rgba(139,60,247,0.55)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personaje */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div animate={controls}>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4.0, times: [0, 0.5, 1], ease: ['easeIn', 'easeOut'] }}
            whileHover={{ x: 5, transition: { duration: 0.35, ease: 'easeOut' } }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: 'clamp(100px, 10vw, 140px)',
                height: 'auto',
                opacity: ready ? 1 : 0,
                transition: 'opacity 0.4s ease',
                filter: 'drop-shadow(-4px 10px 22px rgba(0,0,0,0.6))',
                display: 'block',
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Hint */}
      <motion.p
        className="font-mono text-[8px] text-white/25 tracking-widest uppercase text-center mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.0, duration: 1 }}
      >
        toca para hablar
      </motion.p>
    </div>
  )
}
