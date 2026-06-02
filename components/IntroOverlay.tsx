'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

/* Tiempos (ms) — cambialos acá y todo se reordena solo */
const HOLD_DURATION = 1100
const EXIT_DURATION = 900
const TOTAL_VISIBLE = 1400 + HOLD_DURATION  // tiempo antes de empezar a salir

export default function IntroOverlay() {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 1400)
    const t2 = setTimeout(() => setPhase('out'), TOTAL_VISIBLE)
    const t3 = setTimeout(() => setGone(true), TOTAL_VISIBLE + EXIT_DURATION)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (gone) return null

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#070508' }}
          /* Exit: zoom + fade + blur. Sensación de "atravesar" el logo hacia el hero. */
          animate={phase === 'out' ? { opacity: 0, scale: 1.18, filter: 'blur(10px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: phase === 'out' ? EXIT_DURATION / 1000 : 0, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* ── Capa 1: textura grain (SVG fractalNoise) ────────────────── */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0 0.9  0 0 0 0.22 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
              backgroundSize: '240px 240px',
              opacity: 0.45,
              mixBlendMode: 'overlay',
            }}
          />

          {/* ── Capa 2: aurora morada que respira ──────────────────────── */}
          <motion.div
            className="absolute pointer-events-none"
            aria-hidden
            style={{
              width: 'min(140vmin, 1200px)',
              height: 'min(140vmin, 1200px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,60,247,0.40) 0%, rgba(139,60,247,0.22) 25%, rgba(196,82,255,0.12) 45%, transparent 70%)',
              filter: 'blur(40px)',
              willChange: 'transform, opacity',
            }}
            animate={{ scale: [0.92, 1.04, 0.92], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Capa 3: aurora naranja secundaria (más chica, offset) ──── */}
          <motion.div
            className="absolute pointer-events-none"
            aria-hidden
            style={{
              width: 'min(80vmin, 720px)',
              height: 'min(80vmin, 720px)',
              borderRadius: '50%',
              top: '15%',
              right: '10%',
              background: 'radial-gradient(circle, rgba(255,140,50,0.22) 0%, rgba(196,82,0,0.12) 35%, transparent 65%)',
              filter: 'blur(50px)',
              willChange: 'transform, opacity',
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />

          {/* ── Vignette para enfocar el centro ─────────────────────────── */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(7,5,8,0.65) 90%)' }}
          />

          {/* ── Logo + overlays animados ────────────────────────────────── */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/logo-opening.png"
              alt="Pipe Santos"
              width={420}
              height={280}
              className="w-[72vw] max-w-sm md:max-w-md h-auto"
              priority
            />

            {/* Guiño sobre el ● rojo del REC */}
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

          {/* ── Tagline tipográfico debajo del logo ─────────────────────── */}
          <motion.div
            className="relative z-10 mt-6 md:mt-8 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
          >
            <p
              className="font-mono text-[10px] md:text-xs tracking-[0.45em] uppercase text-center"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Historias · Storytelling · Conexión
            </p>
          </motion.div>

          {/* ── Progress line abajo: se llena en TOTAL_VISIBLE ms ──────── */}
          <div
            className="absolute bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 h-[1.5px] overflow-hidden rounded-full"
            style={{ width: 'min(60vw, 320px)', background: 'rgba(255,255,255,0.08)' }}
            aria-hidden
          >
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(to right, rgba(139,60,247,0.95), rgba(196,82,255,0.95), rgba(255,140,50,0.85))',
                boxShadow: '0 0 12px rgba(139,60,247,0.7)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: TOTAL_VISIBLE / 1000, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
