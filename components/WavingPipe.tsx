'use client'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const messages = [
  '¡Hola! 👋',
  '¡Bienvenido!',
  'Dale clic 😄',
  '¡Nos vemos en Barranquilla! 🔥',
  '¡Gracias por estar aquí! ✨',
]

export default function WavingPipe() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [clicked, setClicked] = useState(false)
  const controls = useAnimationControls()

  const handleClick = async () => {
    setClicked(true)
    setMsgIndex(i => (i + 1) % messages.length)
    await controls.start({
      scale: [1, 1.06, 0.96, 1.03, 1],
      rotate: [0, -3, 3, -2, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    })
    setClicked(false)
  }

  return (
    <motion.div
      className="relative cursor-pointer select-none flex flex-col items-center"
      onClick={handleClick}
      initial={{ opacity: 0, x: 60, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow de fondo */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 60%, rgba(139,60,247,0.35) 0%, rgba(139,60,247,0.08) 50%, transparent 75%)',
        transform: 'scale(1.5)',
      }} />

      {/* Burbuja de diálogo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-3 px-4 py-2 rounded-2xl text-sm font-body font-medium text-white text-center whitespace-nowrap z-20"
          style={{
            background: 'rgba(139,60,247,0.18)',
            border: '1px solid rgba(139,60,247,0.45)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(139,60,247,0.2)',
          }}
        >
          {messages[msgIndex]}
          {/* Cola de la burbuja */}
          <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
            style={{
              background: 'rgba(139,60,247,0.18)',
              borderRight: '1px solid rgba(139,60,247,0.45)',
              borderBottom: '1px solid rgba(139,60,247,0.45)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Figura flotante */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        className="relative z-10"
      >
        <motion.img
          src="/pipe-hero.png"
          alt="Pipe Santos"
          className="w-36 md:w-44 drop-shadow-2xl relative z-10"
          animate={controls}
          whileHover={{ scale: 1.04, transition: { duration: 0.3 } }}
          style={{ filter: 'drop-shadow(0 8px 32px rgba(139,60,247,0.4))' }}
        />

        {/* Mano saludando */}
        <motion.span
          className="absolute -right-5 top-4 text-2xl md:text-3xl z-20 pointer-events-none"
          animate={{ rotate: [0, 22, -8, 22, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut', repeatDelay: 1.5 }}
          style={{ transformOrigin: 'bottom center', display: 'inline-block' }}
        >
          👋
        </motion.span>
      </motion.div>

      {/* Texto "toca para saludar" primera vez */}
      <motion.p
        className="font-mono text-[9px] text-white/30 tracking-widest uppercase mt-2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        toca para saludar
      </motion.p>
    </motion.div>
  )
}
