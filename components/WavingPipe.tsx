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

/** Carga la imagen y remueve el fondo blanco via canvas */
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
        // Elimina píxeles blancos/casi blancos (fondo del PNG)
        if (r > 230 && g > 230 && b > 230) {
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
  const { canvasRef, ready } = useTransparentImage('/pipe-3d.png')

  const handleClick = async () => {
    if (clicked) return
    setClicked(true)
    setMsgIndex(i => (i + 1) % messages.length)
    await controls.start({
      y: [0, -20, 5, -10, 0],
      rotate: [0, -4, 4, -2, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    })
    setClicked(false)
  }

  return (
    <motion.div
      className="relative cursor-pointer select-none flex flex-col items-center"
      onClick={handleClick}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      initial={{ opacity: 0, x: 60, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow morado de fondo */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '180%',
          height: '70%',
          background: 'radial-gradient(ellipse at 50% 80%, rgba(139,60,247,0.35) 0%, rgba(139,60,247,0.08) 55%, transparent 75%)',
        }}
      />

      {/* Burbuja de diálogo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, y: 10, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.9 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-3 px-4 py-2 rounded-2xl text-sm font-body font-medium text-white text-center whitespace-nowrap z-20"
          style={{
            background: 'rgba(139,60,247,0.18)',
            border: '1px solid rgba(139,60,247,0.55)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(139,60,247,0.28)',
          }}
        >
          {messages[msgIndex]}
          <div
            className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
            style={{
              background: 'rgba(139,60,247,0.18)',
              borderRight: '1px solid rgba(139,60,247,0.55)',
              borderBottom: '1px solid rgba(139,60,247,0.55)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Figura flotante */}
      <motion.div
        className="relative z-10 w-44 md:w-56"
        animate={controls}
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          whileHover={{ scale: 1.06 }}
        >
          {/* Sombra debajo */}
          <motion.div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{
              width: '55%',
              height: 14,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 75%)',
              filter: 'blur(6px)',
            }}
            animate={{ scaleX: [1, 0.82, 1], opacity: [0.5, 0.3, 0.5] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          />

          {/* Canvas con fondo blanco removido */}
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.4s ease',
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.55))',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Hint */}
      <motion.p
        className="font-mono text-[9px] text-white/25 tracking-widest uppercase mt-1 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 1 }}
      >
        toca para saludar
      </motion.p>

      {/* Partículas */}
      <motion.div
        className="absolute top-8 -left-3 w-2 h-2 rounded-full pointer-events-none"
        style={{ background: 'rgba(139,60,247,0.65)' }}
        animate={{ y: [-6, 6, -6], opacity: [0.65, 1, 0.65] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-16 -right-2 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: 'rgba(255,140,66,0.6)' }}
        animate={{ y: [5, -5, 5], opacity: [0.5, 0.9, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-32 -right-4 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: 'rgba(139,60,247,0.4)' }}
        animate={{ y: [-8, 8, -8], opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
