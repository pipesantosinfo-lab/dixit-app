'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

const SHOW_DURATION = 2400
const EXIT_DURATION = 1100

/* Partículas pre-computadas (deterministas → no rehidratan distinto).
 * 56 partículas distribuidas radialmente con jitter para que se sienta
 * caótico-orgánico, no perfectamente uniforme. */
const PARTICLE_COUNT = 56
const PALETTE = [
  'rgba(255,255,255,0.95)',   // blanco
  'rgba(139,60,247,1)',        // morado brand
  'rgba(196,82,255,1)',        // morado claro
  'rgba(255,140,50,0.95)',     // naranja brand
  'rgba(255,200,80,0.95)',     // oro
  'rgba(148,204,212,0.9)',     // cyan (del high-five)
]
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  // Ángulo base distribuido + jitter para asimetría
  const baseAngle = (i / PARTICLE_COUNT) * Math.PI * 2
  const jitter = (((i * 31) % 17) / 17 - 0.5) * 0.7
  const angle = baseAngle + jitter
  // Distancia variable: 240-560px del centro
  const distance = 240 + ((i * 41) % 320)
  // Tamaño variable: 3-11px (mix de "polvo" + "chispas" más grandes)
  const size = 3 + ((i * 7) % 9)
  return {
    angle,
    distance,
    size,
    color: PALETTE[i % PALETTE.length],
    // Offset inicial pequeño cerca del centro (efecto "estaban dentro del logo")
    initialX: ((i * 13) % 60) - 30,
    initialY: ((i * 17) % 50) - 25,
    // Delay escalonado 0-300ms para que no exploten todas al mismo tiempo
    delay: ((i * 11) % 300) / 1000,
  }
})

export default function IntroOverlay() {
  const [exiting, setExiting] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), SHOW_DURATION)
    const t2 = setTimeout(() => setGone(true), SHOW_DURATION + EXIT_DURATION + 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (gone) return null

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ pointerEvents: exiting ? 'none' : 'auto' }}
    >
      {/* ── Bg + contenido (auroras / tagline / progress) ───────────────── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          background: '#070508',
          opacity: exiting ? 0 : 1,
          transition: `opacity ${EXIT_DURATION * 0.7}ms ease-out ${EXIT_DURATION * 0.25}ms`,
        }}
      >
        {/* Grain */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0 0.9  0 0 0 0.22 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
            backgroundSize: '240px 240px',
            opacity: 0.45,
            mixBlendMode: 'overlay',
          }}
        />

        {/* Aurora morada */}
        <motion.div
          className="absolute rounded-full"
          aria-hidden
          style={{
            width: 'min(140vmin, 1200px)',
            height: 'min(140vmin, 1200px)',
            background: 'radial-gradient(circle, rgba(139,60,247,0.40) 0%, rgba(139,60,247,0.22) 25%, rgba(196,82,255,0.12) 45%, transparent 70%)',
            filter: 'blur(40px)',
            willChange: 'transform, opacity',
          }}
          animate={{ scale: [0.92, 1.04, 0.92], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Aurora naranja secundaria */}
        <motion.div
          className="absolute rounded-full"
          aria-hidden
          style={{
            width: 'min(80vmin, 720px)',
            height: 'min(80vmin, 720px)',
            top: '15%',
            right: '10%',
            background: 'radial-gradient(circle, rgba(255,140,50,0.22) 0%, rgba(196,82,0,0.12) 35%, transparent 65%)',
            filter: 'blur(50px)',
            willChange: 'transform, opacity',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(7,5,8,0.65) 90%)' }}
        />

        {/* Tagline */}
        <motion.div
          className="relative z-10 mt-32 md:mt-40"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
        >
          <p
            className="font-mono text-[10px] md:text-xs tracking-[0.45em] uppercase text-center"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Historias · Storytelling · Conexión
          </p>
        </motion.div>

        {/* Progress line */}
        <div
          className="absolute bottom-10 md:bottom-14 h-[1.5px] overflow-hidden rounded-full"
          style={{
            width: 'min(60vw, 320px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.08)',
          }}
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
            transition={{ duration: SHOW_DURATION / 1000, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── Logo (fade rápido cuando empieza el exit) ───────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 10 }}
          animate={
            exiting
              ? { opacity: 0, scale: 1.08, y: 0 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          transition={
            exiting
              ? { duration: 0.35, ease: 'easeOut' }
              : { duration: 1, ease: [0.16, 1, 0.3, 1] }
          }
          style={{ willChange: 'transform, opacity' }}
        >
          <Image
            src="/logo-opening.png"
            alt="Pipe Santos"
            width={420}
            height={280}
            className="w-[72vw] max-w-sm md:max-w-md h-auto"
            priority
          />
        </motion.div>
      </div>

      {/* ── Partículas: 56 puntos que explotan radialmente ──────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 1.8}px ${p.color}`,
              willChange: 'transform, opacity',
            }}
            initial={{ x: p.initialX, y: p.initialY, opacity: 0, scale: 0 }}
            animate={
              exiting
                ? {
                    x: [p.initialX, Math.cos(p.angle) * p.distance],
                    y: [p.initialY, Math.sin(p.angle) * p.distance],
                    opacity: [0, 1, 0.85, 0],
                    scale: [0, 1.3, 0.9, 0.3],
                  }
                : { x: p.initialX, y: p.initialY, opacity: 0, scale: 0 }
            }
            transition={
              exiting
                ? {
                    duration: 1.0,
                    delay: p.delay,
                    times: [0, 0.18, 0.55, 1],
                    ease: [0.22, 1, 0.36, 1],  // expo-out: fast burst + smooth tail
                  }
                : { duration: 0 }
            }
          />
        ))}
      </div>

      {/* ── Pequeño flash blanco-morado en el momento de la explosión ──── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(196,82,255,0.25) 20%, transparent 50%)',
          opacity: exiting ? 0.75 : 0,
          transition: 'opacity 180ms ease-out 80ms',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  )
}
