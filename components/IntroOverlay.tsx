'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function IntroOverlay() {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 1400)
    const t2 = setTimeout(() => setPhase('out'), 2500)
    const t3 = setTimeout(() => setGone(true), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (gone) return null

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
          style={{ background: '#070508' }}
          animate={phase === 'out' ? { y: '-100%' } : { y: 0 }}
          transition={phase === 'out' ? { duration: 0.9, ease: [0.76, 0, 0.24, 1] } : { duration: 0 }}
        >
          {/* Logo + overlays animados */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/logo-opening.png"
              alt="Pipe Santos"
              width={420}
              height={280}
              className="w-[72vw] max-w-sm md:max-w-md h-auto"
              priority
            />

            {/* ── Guiño sobre el ● rojo del REC ───────────────
                Cubre el punto con el color de fondo para simular
                el parpadeo de un ojo (scaleY 0→1→0)            */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                background: '#070508',
                width: '8%',
                aspectRatio: '1',
                top: '61%',
                left: '33%',
                transformOrigin: 'center center',
              }}
              animate={{ scaleY: [0, 1, 0, 0, 0, 1, 0] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                times: [0, 0.05, 0.1, 0.45, 0.6, 0.65, 0.7],
                ease: 'easeInOut',
                delay: 1.3,
              }}
            />

          </motion.div>

          {/* Línea morada inferior */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(to right, transparent, rgba(139,60,247,0.7), transparent)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
