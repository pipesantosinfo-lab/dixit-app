'use client'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

const messages = [
  '¡Hola! 👋',
  '¡Bienvenido!',
  '¡Conectemos! 🔥',
  '¡Nos vemos en Barranquilla!',
  '¡Gracias por estar aquí! ✨',
]

/** Elimina el fondo blanco del PNG via canvas */
function useTransparentImage(src: string) {
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
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2]
        if (r > 220 && g > 220 && b > 220) {
          d[i + 3] = 0
        }
      }
      ctx.putImageData(imageData, 0, 0)
      setReady(true)
    }
    img.src = src
  }, [src])

  return { canvasRef, ready }
}

export default function WavingPipe() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [clicked, setClicked] = useState(false)
  const controls = useAnimationControls()
  const { canvasRef, ready } = useTransparentImage('/pipe-peek.png')

  const handleClick = async () => {
    if (clicked) return
    setClicked(true)
    setMsgIndex(i => (i + 1) % messages.length)
    await controls.start({
      x: [0, -12, 4, -6, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    })
    setClicked(false)
  }

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      onClick={handleClick}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      /* Entra deslizándose desde la derecha */
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.0, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Burbuja de diálogo — aparece a la izquierda */}
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, x: 16, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 8, scale: 0.9 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 -translate-x-[calc(100%+52px)] top-8 px-4 py-2 rounded-2xl text-sm font-body font-medium text-white whitespace-nowrap z-30"
          style={{
            background: 'rgba(139,60,247,0.18)',
            border: '1px solid rgba(139,60,247,0.55)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(139,60,247,0.28)',
          }}
        >
          {messages[msgIndex]}
          {/* Punta de la burbuja apuntando a la derecha */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -right-[9px] w-4 h-4 rotate-45"
            style={{
              background: 'rgba(139,60,247,0.18)',
              borderRight: '1px solid rgba(139,60,247,0.55)',
              borderTop: '1px solid rgba(139,60,247,0.55)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Figura — flota suavemente */}
      <motion.div animate={controls}>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          whileHover={{ x: -8, transition: { duration: 0.3 } }}
        >
          <canvas
            ref={canvasRef}
            className="h-auto"
            style={{
              width: 'clamp(180px, 22vw, 320px)',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.4s ease',
              filter: 'drop-shadow(-8px 12px 28px rgba(0,0,0,0.6))',
              display: 'block',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Hint */}
      <motion.p
        className="font-mono text-[9px] text-white/25 tracking-widest uppercase text-center mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
      >
        toca para saludar
      </motion.p>

      {/* Partícula morada */}
      <motion.div
        className="absolute top-16 -left-6 w-2 h-2 rounded-full pointer-events-none"
        style={{ background: 'rgba(139,60,247,0.7)' }}
        animate={{ y: [-6, 6, -6], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
