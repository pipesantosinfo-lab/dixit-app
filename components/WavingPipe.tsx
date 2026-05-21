'use client'
import { motion, useAnimationControls } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

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
        if (r > 220 && g > 220 && b > 220) d[i + 3] = 0
      }
      ctx.putImageData(imageData, 0, 0)
      setReady(true)
    }
    img.src = src
  }, [src])

  return { canvasRef, ready }
}

interface WavingPipeProps {
  onAvatarClick?: () => void
}

export default function WavingPipe({ onAvatarClick }: WavingPipeProps) {
  const [clicked, setClicked] = useState(false)
  const controls = useAnimationControls()
  const { canvasRef, ready } = useTransparentImage('/pipe-peek.png')

  const handleClick = async () => {
    if (clicked) return
    setClicked(true)
    onAvatarClick?.()
    await controls.start({
      x: [0, -12, 4, -6, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    })
    setClicked(false)
  }

  return (
    <motion.div
      className="cursor-pointer select-none"
      onClick={handleClick}
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.0, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
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
