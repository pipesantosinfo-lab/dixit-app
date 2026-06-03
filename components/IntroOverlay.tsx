'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

/* Tiempos (ms) */
const SHOW_DURATION = 2400   // tiempo total visible antes de empezar a salir
const EXIT_DURATION = 1100   // duración del curtain split

export default function IntroOverlay() {
  const [exiting, setExiting] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), SHOW_DURATION)
    const t2 = setTimeout(() => setGone(true), SHOW_DURATION + EXIT_DURATION + 50)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (gone) return null

  // Easing teatral: expo-out → arranca rápido y desacelera dramáticamente
  // (como una cortina pesada que sale por inercia y se acomoda)
  const curtainEase = 'cubic-bezier(0.16, 1, 0.3, 1)'

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ pointerEvents: exiting ? 'none' : 'auto' }}
    >
      {/* ── Cortina superior — sube ────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 overflow-hidden"
        style={{
          background: '#070508',
          transform: exiting ? 'translateY(-100%)' : 'translateY(0)',
          transition: `transform ${EXIT_DURATION}ms ${curtainEase}`,
          willChange: 'transform',
        }}
      />

      {/* ── Cortina inferior — baja ────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden"
        style={{
          background: '#070508',
          transform: exiting ? 'translateY(100%)' : 'translateY(0)',
          transition: `transform ${EXIT_DURATION}ms ${curtainEase}`,
          willChange: 'transform',
        }}
      />

      {/* ── Rim light morada en el momento del desgarro ────────────────── */}
      <div
        className="absolute inset-x-0 top-1/2 h-[2px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(139,60,247,0.95) 30%, rgba(196,82,255,1) 50%, rgba(139,60,247,0.95) 70%, transparent 95%)',
          boxShadow: '0 0 40px 4px rgba(139,60,247,0.8), 0 0 100px 8px rgba(139,60,247,0.4)',
          transform: `translateY(-50%) scaleX(${exiting ? 1 : 0})`,
          opacity: exiting ? 1 : 0,
          transition: `transform 300ms ease-out 80ms, opacity 200ms ease-out 80ms`,
        }}
      />

      {/* ── Capa de contenido (auroras + logo + tagline + progress) ─────
          Fade-out rápido al inicio del exit para que las cortinas tengan
          protagonismo visual durante el desgarro. */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{
          opacity: exiting ? 0 : 1,
          transition: `opacity ${EXIT_DURATION * 0.4}ms ease-out`,
        }}
      >
        {/* Capa 1: textura grain */}
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

        {/* Capa 2: aurora morada que respira */}
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

        {/* Capa 3: aurora naranja secundaria */}
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

        {/* Logo */}
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
        </motion.div>

        {/* Tagline */}
        <motion.div
          className="relative z-10 mt-6 md:mt-8"
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
    </div>
  )
}
