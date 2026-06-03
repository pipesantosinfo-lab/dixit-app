'use client'
import { motion, animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

const SHOW_DURATION = 2400
const EXIT_DURATION = 900  // más corto: el punch es explosivo

export default function IntroOverlay() {
  const [exiting, setExiting] = useState(false)
  const [gone, setGone] = useState(false)
  const [punch, setPunch] = useState(0)  // 0 → 1 durante el exit

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), SHOW_DURATION)
    const t2 = setTimeout(() => setGone(true), SHOW_DURATION + EXIT_DURATION + 50)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    if (!exiting) return
    const controls = animate(0, 1, {
      duration: EXIT_DURATION / 1000,
      ease: [0.7, 0, 0.3, 1],  // S-curve agresiva: arranca lento, explota, desacelera
      onUpdate: setPunch,
    })
    return () => controls.stop()
  }, [exiting])

  if (gone) return null

  /* Curva no-lineal sobre el punch (pow 1.6) → el logo se queda casi quieto
   * al inicio y después explota. Sensación clásica de "anticipación + impacto". */
  const punchPow = Math.pow(punch, 1.6)

  const logoScale = 1 + punchPow * 13       // 1 → 14
  const motionBlur = punchPow * 22          // 0 → 22px
  /* Bg + contenido se mantienen opacos hasta el ~70% y caen rápido al final. */
  const bgOpacity = punch < 0.7 ? 1 : Math.max(0, 1 - (punch - 0.7) * 3.4)
  /* White flash centrado en punch=0.82 — campana estrecha que enmascara el cambio. */
  const flashOpacity = Math.max(0, 1 - Math.abs(punch - 0.82) * 6.5)
  /* Streaks radiales emergen junto con el zoom — "speed lines" del manga. */
  const streaksOpacity = punch > 0.25 ? Math.min(1, (punch - 0.25) * 2.5) * (1 - punch * 0.7) : 0

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ pointerEvents: exiting ? 'none' : 'auto' }}
    >
      {/* ── Bg negro + contenido (auroras / tagline / progress) ─────────── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          background: '#070508',
          opacity: bgOpacity,
        }}
      >
        {/* Grain texture */}
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

      {/* ── Speed lines radiales (capa fija que aparece durante el punch) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: `conic-gradient(from 0deg,
            transparent 0deg, rgba(255,255,255,0.18) 2deg, transparent 7deg,
            transparent 12deg, rgba(255,255,255,0.18) 14deg, transparent 19deg,
            transparent 24deg, rgba(255,255,255,0.18) 26deg, transparent 31deg,
            transparent 36deg, rgba(255,255,255,0.18) 38deg, transparent 43deg,
            transparent 48deg, rgba(255,255,255,0.18) 50deg, transparent 55deg,
            transparent 60deg, rgba(255,255,255,0.18) 62deg, transparent 67deg,
            transparent 72deg, rgba(255,255,255,0.18) 74deg, transparent 79deg,
            transparent 84deg, rgba(255,255,255,0.18) 86deg, transparent 91deg,
            transparent 96deg, rgba(255,255,255,0.18) 98deg, transparent 103deg,
            transparent 108deg, rgba(255,255,255,0.18) 110deg, transparent 115deg,
            transparent 120deg, rgba(255,255,255,0.18) 122deg, transparent 127deg,
            transparent 360deg)`,
          WebkitMaskImage: 'radial-gradient(circle, transparent 25%, black 60%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 25%, black 60%, transparent 100%)',
          opacity: streaksOpacity,
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Logo (fuera del bg para que el scale + blur no se limite) ───── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transform: `scale(${logoScale})`,
            filter: `blur(${motionBlur}px)`,
            opacity: 1 - Math.max(0, (punch - 0.78) * 4.5),  // fade quick at end
            willChange: 'transform, filter, opacity',
          }}
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

      {/* ── White flash en el momento del impacto ───────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 25%, rgba(196,82,255,0.3) 55%, transparent 80%)',
          opacity: flashOpacity,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  )
}
