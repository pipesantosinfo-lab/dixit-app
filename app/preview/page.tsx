'use client'
import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useInView, useMotionValueEvent } from 'framer-motion'
import Particles from '@/components/Particles'
import WavingPipe from '@/components/WavingPipe'
import TransparentImg from '@/components/TransparentImg'
import IntroOverlay from '@/components/IntroOverlay'
import BorisCharacter from '@/components/BorisCharacter'
import EventoCharacter from '@/components/EventoCharacter'
import { track } from '@/lib/track'

/* ── ScrambleText ────────────────────────────────── */
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%&'

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [revealed, setRevealed] = useState(0)
  const [scramble, setScramble] = useState<string[]>(() =>
    text.split('').map(() => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)])
  )
  const [active, setActive] = useState(false)

  useEffect(() => {
    let count = 0
    let scrambleTimer: ReturnType<typeof setInterval>

    const delayTimer = setTimeout(() => {
      setActive(true)
      scrambleTimer = setInterval(() => {
        setScramble(text.split('').map(() =>
          SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        ))
      }, 35)

      const revealNext = () => {
        if (count >= text.length) { clearInterval(scrambleTimer); return }
        count++
        setRevealed(count)
        setTimeout(revealNext, 72)
      }
      setTimeout(revealNext, 72)
    }, delay)

    return () => { clearTimeout(delayTimer); clearInterval(scrambleTimer) }
  }, [text, delay])

  // Cada letra ocupa siempre el espacio del carácter real → sin layout shift
  return (
    <>
      {text.split('').map((char, i) => (
        <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
          {/* Carácter real: invisible hasta que se revela, pero siempre ocupa su espacio */}
          <span style={{ visibility: i < revealed || !active ? 'visible' : 'hidden' }}>{char}</span>
          {/* Carácter scramble: superpuesto, desaparece al revelar */}
          {active && i >= revealed && (
            <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0 }}>
              {scramble[i]}
            </span>
          )}
        </span>
      ))}
    </>
  )
}

/* ── HeartParticles ──────────────────────────────── */
const HEART_EMOJIS = ['❤️', '❤️', '👍', '🩷', '💜', '👍', '❤️', '👍', '🩷', '❤️']

interface Heart {
  id: number
  x: number
  size: number
  drift: number
  duration: number
  delay: number
  emoji: string
}

let _heartId = 0
function makeHeart(burst = false): Heart {
  return {
    id: _heartId++,
    x: 5 + Math.random() * 90,
    size: 10 + Math.random() * 18,
    drift: (Math.random() - 0.5) * 80,
    duration: 2.2 + Math.random() * 1.6,
    delay: burst ? Math.random() * 0.7 : 0,
    emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
  }
}

/* ── Fondo animado de la sección de redes — orbes de luz + grid sutil ── */
function SocialSectionBg({ active = true }: { active?: boolean }) {
  // Cuando la sección está fuera de viewport, pasamos animate={undefined} →
  // los orbes se quedan estáticos y Framer NO programa rAFs. Ahorra CPU/GPU
  // en mobile cuando ya scrolleaste más allá.
  const inf = (def: { x: number[]; y: number[]; scale: number[] }) => active ? def : undefined
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden style={{ zIndex: 0 }}>
      {/* Orbe morado — detrás de la tarjeta IZQUIERDA (TikTok) */}
      <motion.div
        className="absolute rounded-full orb-blur"
        style={{
          width: 'clamp(280px, 45vw, 560px)',
          height: 'clamp(280px, 45vw, 560px)',
          top: '15%',
          left: '5%',
          background: 'radial-gradient(circle, rgba(139,60,247,0.75) 0%, rgba(139,60,247,0.35) 35%, transparent 70%)',
          willChange: 'transform',
        }}
        animate={inf({ x: [0, 160, -80, 0], y: [0, 120, 180, 0], scale: [1, 1.3, 0.75, 1] })}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbe naranja principal — detrás de la tarjeta CENTRO (Instagram) */}
      <motion.div
        className="absolute rounded-full orb-blur"
        style={{
          width: 'clamp(320px, 50vw, 620px)',
          height: 'clamp(320px, 50vw, 620px)',
          top: '15%',
          left: '32%',
          background: 'radial-gradient(circle, rgba(255,140,50,0.95) 0%, rgba(255,100,30,0.50) 30%, rgba(196,82,0,0.20) 55%, transparent 75%)',
          willChange: 'transform',
        }}
        animate={inf({ x: [-80, 140, -80], y: [-50, 100, -50], scale: [0.85, 1.3, 0.85] })}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbe rosa Instagram — clave para la identidad IG; lo mantenemos en
          mobile pero ligeramente más pequeño para no comer fps */}
      <motion.div
        className="absolute rounded-full orb-blur"
        style={{
          width: 'clamp(260px, 38vw, 460px)',
          height: 'clamp(260px, 38vw, 460px)',
          top: '40%',
          left: '38%',
          background: 'radial-gradient(circle, rgba(244,114,182,0.85) 0%, rgba(231,72,153,0.40) 30%, rgba(190,40,130,0.18) 55%, transparent 75%)',
          willChange: 'transform',
        }}
        animate={inf({ x: [60, -90, 60], y: [40, -70, 40], scale: [1, 1.25, 1] })}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
      />

      {/* Orbe cyan — detrás de la tarjeta DERECHA (Facebook) */}
      <motion.div
        className="absolute rounded-full orb-blur"
        style={{
          width: 'clamp(300px, 48vw, 600px)',
          height: 'clamp(300px, 48vw, 600px)',
          top: '20%',
          right: '5%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.55) 0%, rgba(34,211,238,0.22) 35%, transparent 70%)',
          willChange: 'transform',
        }}
        animate={inf({ x: [0, -160, 80, 0], y: [0, -120, -50, 0], scale: [1, 0.75, 1.3, 1] })}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbe magenta — OCULTO EN MOBILE */}
      <motion.div
        className="absolute rounded-full orb-blur hidden md:block"
        style={{
          width: 'clamp(280px, 38vw, 480px)',
          height: 'clamp(280px, 38vw, 480px)',
          bottom: '5%',
          left: '15%',
          background: 'radial-gradient(circle, rgba(196,60,255,0.65) 0%, rgba(196,60,255,0.22) 35%, transparent 70%)',
          willChange: 'transform',
        }}
        animate={inf({ x: [0, 130, -70, 0], y: [0, -90, 70, 0], scale: [1, 1.25, 0.8, 1] })}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* Orbe aurora verde-azul — bottom-right para balancear */}
      <motion.div
        className="absolute rounded-full orb-blur"
        style={{
          width: 'clamp(240px, 38vw, 480px)',
          height: 'clamp(240px, 38vw, 480px)',
          bottom: '10%',
          right: '20%',
          background: 'radial-gradient(circle, rgba(80,200,255,0.55) 0%, rgba(80,200,255,0.18) 35%, transparent 70%)',
          willChange: 'transform',
        }}
        animate={inf({ x: [0, -100, 50, 0], y: [0, 70, -90, 0], scale: [0.85, 1.2, 0.9, 0.85] })}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 2.8 }}
      />

      {/* Grid sutil sobre los orbes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 30%, transparent 80%)',
        }}
      />

      {/* Vignettes en bordes superior e inferior para fundir con secciones vecinas */}
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #070508 0%, transparent 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, #070508 0%, transparent 100%)' }} />
    </div>
  )
}

/* ── Sección Marcas: marquee de una sola fila infinita ──────────────── */
function BrandsSection() {
  return (
    <section className="relative z-10 py-10 md:py-12 overflow-hidden brands-section">
      {/* Fondo blanco con textura sutil */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{ background: '#ffffff' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
          backgroundSize: '200px 200px',
          opacity: 0.6,
          mixBlendMode: 'multiply',
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139,60,247,0.06) 0%, transparent 60%)',
        }} />
      </div>

      {/* Título */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}
        className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center mb-7 md:mb-9"
      >
        <p className="font-mono text-[10px] md:text-xs tracking-[0.4em] uppercase mb-2" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Han confiado en mí</p>
        <h2 className="font-display text-2xl md:text-4xl font-light mb-3" style={{ color: '#1a1a1a' }}>
          Algunas <span className="italic" style={{ color: 'rgba(139,60,247,0.95)' }}>marcas</span> con las que trabajo
        </h2>
        <p className="font-body text-sm md:text-base leading-relaxed" style={{ color: 'rgba(26,26,26,0.6)' }}>
          Empresas, instituciones y proyectos que me han abierto sus puertas para transformar audiencias con storytelling.
        </p>
      </motion.div>

      {/* Marquee de una sola fila — loop infinito.
          PNG con fondo transparente para que se vea la textura blanca debajo.
          La cinta combinada (logos 1 + logos 2) es muy ancha, basta con 2 copias
          para cubrir cualquier viewport ≤ ~3344px y mantener la velocidad previa. */}
      <div className="relative z-10 brands-marquee">
        <div className="brands-marquee-track">
          {[0, 1].map(copy => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={copy}
              src="/marcas/logos-mejor.png"
              alt={copy === 0 ? 'Marcas con las que ha trabajado Pipe Santos' : ''}
              className="brands-marquee-img"
              loading="eager"
              decoding="async"
              draggable={false}
              aria-hidden={copy !== 0}
            />
          ))}
        </div>
      </div>

      {/* Vignettes laterales en blanco para fundido limpio */}
      <div className="absolute inset-y-0 left-0 w-20 md:w-32 pointer-events-none z-20"
        style={{ background: 'linear-gradient(90deg, #ffffff 0%, transparent 100%)' }} />
      <div className="absolute inset-y-0 right-0 w-20 md:w-32 pointer-events-none z-20"
        style={{ background: 'linear-gradient(270deg, #ffffff 0%, transparent 100%)' }} />
    </section>
  )
}

function HeartParticles({ active }: { active: boolean }) {
  const [hearts, setHearts] = useState<Heart[]>([])

  useEffect(() => {
    if (!active) return
    // Burst: 12 hearts staggered
    setHearts(prev => [...prev, ...Array.from({ length: 12 }, () => makeHeart(true))])
    // Continue: 1 heart every 380ms for 5 s
    let elapsed = 0
    const iv = setInterval(() => {
      elapsed += 380
      if (elapsed > 5000) { clearInterval(iv); return }
      setHearts(prev => [...prev, makeHeart(false)])
    }, 380)
    return () => clearInterval(iv)
  }, [active])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 20 }}>
      <AnimatePresence>
        {hearts.map(h => (
          <motion.div
            key={h.id}
            style={{ position: 'absolute', bottom: '10%', left: `${h.x}%`, fontSize: h.size, lineHeight: 1, userSelect: 'none' }}
            initial={{ y: 0, x: 0, opacity: 0, scale: 0 }}
            animate={{ y: -380, x: h.drift, opacity: [0, 1, 1, 0], scale: [0, 1.4, 1, 0.4] }}
            transition={{ duration: h.duration, delay: h.delay, ease: 'easeOut' }}
            onAnimationComplete={() => setHearts(prev => prev.filter(p => p.id !== h.id))}
          >
            {h.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ── Evento ─────────────────────────────────────── */
const EVENT_DATE  = new Date('2026-08-22T14:00:00-05:00')
const EVENT_MAX   = 300
const EVENT_PRICE = 40000
const EVENT_IG    = 'https://www.instagram.com/pipesantos93/'

/* ── Mensaje de urgencia dinámico ──────────────────────────────
 * Reemplaza el countdown 'X días' (que sonaba lejano y promovía
 * procrastinación) por scarcity messaging basado en cuántas
 * entradas se vendieron vs aforo total.
 *
 * Escalada:
 *   sold=0             → "AFORO LIMITADO · 300 CUPOS"          (pre-venta)
 *   sold<50%           → "AFORO LIMITADO · QUEDAN X CUPOS"     (normal)
 *   sold≥50%           → "VAN +X ENTRADAS · QUEDAN POCAS"      (warning)
 *   sold≥80%           → "ÚLTIMAS X ENTRADAS"                  (critical)
 *   sold≥100%          → "AGOTADAS · LISTA DE ESPERA"          (final)
 *
 * Devuelve full (con ciudad) y short (para sticky bar).        */
function getUrgencyMessage(sold: number) {
  const available = EVENT_MAX - sold
  const ratio = sold / EVENT_MAX

  if (sold === 0) {
    return {
      full: `CUPOS LIMITADOS · ${EVENT_MAX} ENTRADAS · BARRANQUILLA`,
      short: `CUPOS LIMITADOS · ${EVENT_MAX} ENTRADAS`,
      level: 'normal' as const,
    }
  }
  if (ratio >= 1) {
    return {
      full: 'AGOTADAS · LISTA DE ESPERA · BARRANQUILLA',
      short: 'AGOTADAS · LISTA DE ESPERA',
      level: 'critical' as const,
    }
  }
  if (ratio >= 0.8) {
    return {
      full: `ÚLTIMAS ${available} ENTRADAS · NO TE QUEDES AFUERA`,
      short: `ÚLTIMAS ${available} ENTRADAS`,
      level: 'critical' as const,
    }
  }
  if (ratio >= 0.5) {
    return {
      full: `VAN +${sold} ENTRADAS · QUEDAN POCAS · BARRANQUILLA`,
      short: `VAN +${sold} · QUEDAN POCAS`,
      level: 'high' as const,
    }
  }
  return {
    full: `CUPOS LIMITADOS · QUEDAN ${available} ENTRADAS · BARRANQUILLA`,
    short: `CUPOS LIMITADOS · ${available} ENTRADAS`,
    level: 'normal' as const,
  }
}

function useCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = EVENT_DATE.getTime() - Date.now()
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTime({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass rounded-xl w-14 h-14 md:w-20 md:h-20 flex items-center justify-center mb-1"
        style={{ border: '1px solid rgba(139,60,247,0.25)' }}>
        <span className="font-display text-xl md:text-3xl font-light text-white"
          style={{ textShadow: '0 0 20px rgba(139,60,247,0.5)' }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="font-mono text-[9px] md:text-xs text-white/30 tracking-widest uppercase">{label}</span>
    </div>
  )
}

function EventoModal({ onClose, sold }: { onClose: () => void; sold: number }) {
  const [form, setForm]     = useState({ name: '', email: '' })
  const [quantity, setQty]  = useState(1)
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState('')
  const available = EVENT_MAX - sold
  const maxQty    = Math.min(10, available)
  const total     = EVENT_PRICE * quantity

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Tu nombre y correo son obligatorios.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Por favor ingresa un correo válido.'); return }
    setLoad(true); setError('')
    try {
      const res  = await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerName: form.name, buyerEmail: form.email, quantity }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error inesperado')
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.')
      setLoad(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(7,5,8,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl p-8 animate-fade-up"
        style={{ background: 'linear-gradient(145deg,#0d0a14,#140e20)', border: '1px solid rgba(139,60,247,0.3)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8),0 0 60px rgba(139,60,247,0.08)' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-1">Entrada General</p>
            <h2 className="font-display text-2xl text-white">La vida es cule viaje</h2>
            <p className="font-display text-xl mt-1" style={{ color: '#8B3CF7' }}>$40.000 COP</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-3xl leading-none mt-1">×</button>
        </div>
        <SectionDivider className="mb-6" />
        <div className="flex items-center justify-between mb-5 rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="font-body text-white/60 text-sm">Cantidad de entradas</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(139,60,247,0.15)', border: '1px solid rgba(139,60,247,0.3)', color: '#a660f9' }}>−</button>
            <span className="font-display text-xl text-white w-6 text-center">{quantity}</span>
            <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(139,60,247,0.15)', border: '1px solid rgba(139,60,247,0.3)', color: '#a660f9' }}>+</button>
          </div>
        </div>
        {quantity > 1 && (
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="font-mono text-xs text-white/30 uppercase tracking-widest">{quantity} × ${EVENT_PRICE.toLocaleString('es-CO')}</span>
            <span className="font-display text-lg" style={{ color: '#8B3CF7' }}>${total.toLocaleString('es-CO')}</span>
          </div>
        )}
        {available <= 20 && (
          <div className="mb-4 rounded-xl px-4 py-2 text-center"
            style={{ background: 'rgba(196,82,0,0.1)', border: '1px solid rgba(196,82,0,0.25)' }}>
            <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'rgba(196,82,0,0.9)' }}>⚡ Solo quedan {available} entradas</p>
          </div>
        )}
        <div className="space-y-4 mb-6">
          {[{ key: 'name', label: 'Nombre completo *', type: 'text', ph: 'Tu nombre' },
            { key: 'email', label: 'Correo electrónico *', type: 'email', ph: 'tu@correo.com' }].map(f => (
            <div key={f.key}>
              <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-2">{f.label}</label>
              <input type={f.type} value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                className="w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/20 text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,60,247,0.5)')}
                onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')} />
            </div>
          ))}
        </div>
        {error && <p className="text-red-400 text-sm mb-4 font-body">{error}</p>}
        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
          <span>{loading ? 'Redirigiendo a pago seguro...' : `Continuar al pago — $${total.toLocaleString('es-CO')} →`}</span>
        </button>
        <p className="font-mono text-xs text-white/20 text-center mt-4">Pago seguro con Bold · Tu QR llega al instante</p>
      </div>
    </div>
  )
}

/* ── Framer Motion variants ──────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
}
const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: 'easeOut' } },
}
const slideLeft = {
  hidden:  { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
}
const slideRight = {
  hidden:  { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const staggerItem = {
  hidden:  { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}
/* Entrada simple, liviana — solo opacity + translateY corto, easeOut breve.
 * Una sola vez (once:true), sin loops continuos. Cero peso en runtime. */
const stagger3D = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const socialCardEntryLeft = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}
const socialCardEntryRight = socialCardEntryLeft
const socialCardEntryCenter = socialCardEntryLeft
/* Entrada única (no se repite al volver a hacer scroll → cero overhead) */
const VP_REPLAY = { once: true, amount: 0.2 }
const VP = { once: true, amount: 0.15 }

const galleryPhotos = [
  // Fotos nuevas (eventos más recientes) — primero para protagonismo
  '/gallery/_MG_8609.jpg',
  '/gallery/DSC04719.jpg',
  '/gallery/_MG_8653.jpg',
  '/gallery/DSC04778.jpg',
  '/gallery/_MG_8655.jpg',
  '/gallery/_MG_0108_CR2.jpg',
  // Fotos del archivo histórico
  '/gallery/Archivo_096-3.jpg',
  '/gallery/DSC01734.jpg',
  '/gallery/IMG_6477.JPG',
  '/gallery/Archivo_192-2.jpg',
  '/gallery/DSC01782_1.jpg',
  '/gallery/IMG_6481.JPG',
  '/gallery/Archivo_206-2.jpg',
  '/gallery/DSC01807.jpg',
  '/gallery/IMG_7200.JPG',
  '/gallery/Archivo_244.jpg',
  '/gallery/DSC05052.jpg',
  '/gallery/IMG_7542-2.jpg',
  '/gallery/Archivo_540-3.jpg',
  '/gallery/IMG_5232.JPG',
  '/gallery/IMG_8760.jpg',
  '/gallery/Archivo_545-3.jpg',
  '/gallery/IMG_9090.jpg',
  '/gallery/Archivo_565-4.jpg',
  '/gallery/IMG_9667.JPG',
]

function Lightbox({ photos, index, onClose, onPrev, onNext }: {
  photos: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(7,5,8,0.96)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      {/* Prev */}
      <button
        onClick={e => { e.stopPropagation(); onPrev() }}
        className="absolute left-4 md:left-10 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      {/* Image */}
      <div
        className="relative max-w-5xl max-h-[85vh] mx-16"
        onClick={e => e.stopPropagation()}
        style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(139,60,247,0.08)' }}
      >
        <img
          src={photos[index]}
          alt=""
          className="block max-w-full max-h-[85vh] object-contain"
          style={{ minWidth: '280px' }}
        />
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 pt-12"
          style={{ background: 'linear-gradient(to top, rgba(7,5,8,0.8), transparent)' }}>
          <p className="font-mono text-xs text-white/30 tracking-widest">{index + 1} / {photos.length}</p>
        </div>
      </div>

      {/* Next */}
      <button
        onClick={e => { e.stopPropagation(); onNext() }}
        className="absolute right-4 md:right-10 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  )
}

function ReaderGalleryModal({ onClose }: { onClose: () => void }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedIdx !== null) setSelectedIdx(null)
        else onClose()
      }
      if (selectedIdx !== null) {
        if (e.key === 'ArrowLeft') setSelectedIdx(i => i === null ? null : (i - 1 + readerPhotos.length) % readerPhotos.length)
        if (e.key === 'ArrowRight') setSelectedIdx(i => i === null ? null : (i + 1) % readerPhotos.length)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIdx, onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(7,5,8,0.97)', backdropFilter: 'blur(20px)' }}
      onClick={() => { if (selectedIdx !== null) setSelectedIdx(null) }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <div>
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase">◆ Mi libro</p>
          <h3 className="font-display text-2xl text-white font-light mt-1">Algunos de mis lectores</h3>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Grid */}
      {selectedIdx === null && (
        <div className="flex-1 overflow-y-auto px-6 pb-8" onClick={e => e.stopPropagation()}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {readerPhotos.map((src, i) => (
              <button
                key={src}
                onClick={() => setSelectedIdx(i)}
                className="group relative overflow-hidden rounded-xl aspect-square focus:outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <img
                  src={src}
                  alt={`Lector ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  style={{ background: 'rgba(139,60,247,0.3)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedIdx !== null && (
        <div className="flex-1 flex items-center justify-center relative">
          {/* Prev */}
          <button
            onClick={e => { e.stopPropagation(); setSelectedIdx(i => i === null ? null : (i - 1 + readerPhotos.length) % readerPhotos.length) }}
            className="absolute left-4 md:left-10 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          {/* Image */}
          <div
            className="relative mx-16 max-w-4xl"
            onClick={e => e.stopPropagation()}
            style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(139,60,247,0.08)' }}
          >
            <img
              src={readerPhotos[selectedIdx]}
              alt=""
              className="block max-w-full max-h-[75vh] object-contain"
              style={{ minWidth: '280px' }}
            />
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 pt-12"
              style={{ background: 'linear-gradient(to top, rgba(7,5,8,0.8), transparent)' }}>
              <p className="font-mono text-xs text-white/30 tracking-widest">{selectedIdx + 1} / {readerPhotos.length}</p>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); setSelectedIdx(i => i === null ? null : (i + 1) % readerPhotos.length) }}
            className="absolute right-4 md:right-10 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          {/* Back to grid */}
          <button
            onClick={e => { e.stopPropagation(); setSelectedIdx(null) }}
            className="absolute top-0 left-6 flex items-center gap-2 font-mono text-xs text-white/30 hover:text-white/70 transition-colors tracking-widest uppercase"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Ver todas
          </button>
        </div>
      )}
    </div>
  )
}

function useCounter(target: number, duration = 2000, triggered: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!triggered) return
    let start = 0
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [triggered, target, duration])
  return count
}

function StatCard({ num, label, suffix = '' }: { num: string; label: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [triggered, setTriggered] = useState(false)
  const target = parseInt(num.replace(/\D/g, ''))
  const count = useCounter(target, 1800, triggered)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="glass rounded-2xl p-6 md:p-8 text-center">
      <p className="font-display text-4xl md:text-5xl font-light mb-2" style={{ color: '#8B3CF7' }}>
        +{count}{suffix}
      </p>
      <p className="font-mono text-xs text-white/40 tracking-widest uppercase leading-relaxed">{label}</p>
    </div>
  )
}

function SocialCount({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [triggered, setTriggered] = useState(false)
  const count = useCounter(target, 1800, triggered)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true) },
      { threshold: 0, rootMargin: '0px 0px -50px 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return <span ref={ref}>{count}.000</span>
}

const stats = [
  { num: '+300', label: 'Conferencias' },
  { num: '+1', label: 'Seguidores', suffix: 'M' },
  { num: '+10', label: 'Años de experiencia' },
]

const testimonials = [
  {
    quote: 'La capacidad que tiene Pipe Santos para conectar con las personas es impresionante, nunca vi a la comunidad de la universidad tan conectada con un speaker como el día de su presentación en la u.',
    name: 'Jesus Suescun',
    role: 'Coordinador de bienestar universitario — Universidad del Magdalena',
    photo: '/t-jesus.png',
  },
  {
    quote: 'Fue una decisión muy acertada contratar a Pipe para capacitar a nuestros egresados en comunicación, marketing digital y narrativa audiovisual. Su ponencia fue perfecta y todos disfrutaron su participación de principio a fin.',
    name: 'Marelvis Serrano',
    role: 'Coordinadora de egresados — Universidad Tecnológico Comfenalco',
    photo: '/t-marelvis.png',
  },
  {
    quote: 'El evento fue un éxito. Pipe contagió al público con su buena vibra de una forma increíble, los asistentes y nosotros como organizadores quedamos encantados con su ponencia y de verdad que es muy especial escucharlo hablar.',
    name: 'Isamar Ospino',
    role: 'Directora de juventudes — Alcaldía de Plato Magdalena',
    photo: '/t-isamar.png',
  },
  {
    quote: '¡Tuvimos lleno total! Fue un evento en el que había mucha expectativa y gracias a Dios, la presentación de Pipe Santos las superó al 100%. Hizo un espacio de preguntas al final y fue muy bonito ver cómo todos participaban y disfrutaban de su presencia en el evento.',
    name: 'Danilo Caballero',
    role: 'Director operativo — Aprocoda Codazzi',
    photo: '/t-danilo.png',
  },
]

const readerPhotos = [
  '/libro/3353B0BA-E06C-489E-963A-95A46682E29E.JPG',
  '/libro/3A623A50-DFC6-4FDC-BAB3-5A483B9B9701.JPG',
  '/libro/96A99008-B70E-46AC-BACB-5576A02AEA4E.JPG',
  '/libro/B468930B-B008-432C-A0BB-139444EE004D.JPG',
  '/libro/C0551101-7681-4A80-B204-E0FBB56E79B8.JPG',
  '/libro/D6ABBF6D-67B3-49E4-ACDD-642C6165DDF2.JPG',
  '/libro/D6C4A074-7345-4901-B927-D01227CC4A1A.JPG',
  '/libro/DDE1A6C3-832B-4811-8FFC-EEDEE52ACB6A.JPG',
  '/libro/E20C3C28-4C87-49F4-BDF7-344DC8FE1D54.JPG',
  '/libro/E7208B16-3D29-44C9-91DD-24A67ED7B7B6.JPG',
  '/libro/FD92B976-F602-4631-99D8-E288C6261748.JPG',
  '/libro/IMG_2804.PNG',
]

const bookFeatures = [
  { title: 'Historias reales de inicio a fin', desc: 'Encontrarás información muy valiosa para muchos aspectos de tu vida, mientras disfrutas de un viaje en el tiempo por diferentes etapas de mi vida.' },
  { title: 'Proyectos, sueños y metas', desc: 'Descubrirás formas, tips y métodos para escalar hacia tus objetivos más importantes.' },
]

const pipeMessages = ['¡Hola! 👋', '¡Bienvenido!', '¿Ya tienes tu entrada? 🎟️', '¡Nos vemos en Barranquilla!', '¡Gracias por estar aquí! ✨']

/* ── Hint de scroll en el hero ─────────────────────────────────────────
 * Aparece al fondo del hero con una pista visual ("Descubre más" + chevron
 * con bounce sutil). Se desvanece cuando el usuario hace scroll > 80px,
 * y desaparece del DOM tras la transición para no consumir recursos. */
/* Sticky CTA bar para mobile — aparece cuando el usuario pasa el hero
 * pero NO ha llegado todavía a la sección de evento. Punto de acceso
 * permanente al botón de compra durante la navegación. */
function StickyMobileCTA({ urgencyShort, level }: { urgencyShort: string; level: 'normal' | 'high' | 'critical' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => {
      const heroH = window.innerHeight
      const eventoEl = document.getElementById('evento')
      const eventoRect = eventoEl?.getBoundingClientRect()
      // Visible cuando: pasaste 60% del hero AND no estás dentro de #evento
      const passedHero = window.scrollY > heroH * 0.6
      const insideEvento = eventoRect ? eventoRect.top < window.innerHeight * 0.5 && eventoRect.bottom > 0 : false
      setVisible(passedHero && !insideEvento)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="#evento"
          onClick={() => track({ type: 'click', target: 'sticky_buy_cta' })}
          className={`sticky-cta sticky-cta--${level} md:hidden`}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Ir a comprar entrada"
        >
          <div className="sticky-cta__info">
            <p className="sticky-cta__title">Compra tu entrada — 22 ago</p>
            <p className="sticky-cta__meta">
              <span className="sticky-cta__meta-dot" />
              {urgencyShort} · $40.000
            </p>
          </div>
          <span className="sticky-cta__btn">
            Comprar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}

function ScrollHint() {
  // Siempre montado; controlamos visibilidad solo con opacity para evitar
  // saltos de AnimatePresence (que en el dev server a veces no monta a tiempo).
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setScrolled(window.scrollY > 80)
    check()  // estado inicial real
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  return (
    <div
      className="absolute left-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
      style={{
        bottom: 'clamp(16px, 4vh, 36px)',
        transform: 'translateX(-50%)',
        opacity: scrolled ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
      aria-hidden
    >
      <span
        className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        Descubre más
      </span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
      >
        <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
          {/* Mouse outline */}
          <rect x="1.5" y="1.5" width="17" height="21" rx="8.5"
            stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" />
          {/* Wheel dot animado */}
          <motion.circle
            cx="10" r="1.8"
            fill="rgba(139,60,247,1)"
            animate={{ cy: [7, 12, 7], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>
    </div>
  )
}

/* ── Botón magnético: el elemento "es atraído" hacia el cursor cuando éste
 * se acerca. Solo desktop (pointer:fine). Spring suave para evitar tirones. */
function MagneticButton({
  children,
  className,
  href,
  onClick,
  strength = 0.35,
  range = 100,
}: {
  children: React.ReactNode
  className?: string
  href?: string
  onClick?: () => void
  strength?: number   // qué tan fuerte se mueve el botón (0–0.5 razonable)
  range?: number      // a qué distancia en px empieza a "atraer"
}) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null)
  const x = useSpring(0, { stiffness: 150, damping: 15, mass: 0.3 })
  const y = useSpring(0, { stiffness: 150, damping: 15, mass: 0.3 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    // No aplicar en touch devices (no hay cursor)
    if (!window.matchMedia('(pointer: fine)').matches) return

    const handleMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist < rect.width / 2 + range) {
        x.set(dx * strength)
        y.set(dy * strength)
      } else {
        x.set(0)
        y.set(0)
      }
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [strength, range, x, y])

  const inner = (
    <motion.span style={{ x, y, display: 'inline-block', willChange: 'transform' }}>
      {children}
    </motion.span>
  )

  if (href) {
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={className}
      >
        {inner}
      </motion.a>
    )
  }
  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      onClick={onClick}
      className={className}
    >
      {inner}
    </motion.button>
  )
}

/* ── Tilt 3D ────────────────────────────────────────────────────────────
 * Inclina el elemento 4-6° siguiendo el cursor, como Apple product cards.
 * Solo se activa en hover y en pointer:fine. Spring suave para devolverse. */
function Tilt3D({
  children,
  className,
  style,
  maxTilt = 6,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  maxTilt?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useSpring(0, { stiffness: 200, damping: 18, mass: 0.4 })
  const ry = useSpring(0, { stiffness: 200, damping: 18, mass: 0.4 })

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width  // 0–1
    const py = (e.clientY - rect.top) / rect.height
    // Centrar en 0: -0.5 a 0.5, multiplicar por maxTilt
    ry.set((px - 0.5) * maxTilt * 2)
    rx.set((0.5 - py) * maxTilt * 2)
  }
  const handleLeave = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        rotateX: rx,
        rotateY: ry,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
        willChange: 'transform',
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  )
}

/* ── Divider con cluster de barritas tipo equalizer ─────────────────────
 * Reemplaza la línea fina morada por un cluster central animado (6 barras
 * con altura y delay distintos → vibe audio waveform). Subraya el ADN
 * podcaster/storyteller del proyecto. Pure CSS animation, GPU.
 *
 * useInView pausa las animaciones cuando el divider está fuera del
 * viewport → con 8 instancias en la página, esto cae de 48 animaciones
 * activas simultáneas a sólo ~6 (las del divider en pantalla). */
function SectionDivider({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '120px 0px' })
  return (
    <div
      ref={ref}
      className={`section-divider ${inView ? 'section-divider--active' : ''} ${className ?? ''}`}
      aria-hidden
    >
      <span className="section-divider__line section-divider__line--left" />
      <div className="section-divider__eq">
        <span className="section-divider__bar" />
        <span className="section-divider__bar" />
        <span className="section-divider__bar" />
        <span className="section-divider__bar" />
        <span className="section-divider__bar" />
        <span className="section-divider__bar" />
      </div>
      <span className="section-divider__line section-divider__line--right" />
    </div>
  )
}

/* ── Fondo ambiente tipo "pantalla / sala de cine" ──────────────────────
 * 5 capas que unifican showreel + galería con un lenguaje visual coherente:
 *   1. Dot grid morado con mask radial (centro nítido, bordes desvanecidos)
 *   2. Aurora morada superior que respira
 *   3. Aurora naranja inferior con ritmo desincronizado
 *   4. Scanlines CRT muy sutiles (overlay blend)
 *   5. Film grain (fractalNoise SVG + overlay blend)
 * + vignettes top/bottom para fundir con secciones vecinas.            */
/* ── Carrusel horizontal para la galería en mobile ─────────────────────
 * Cada foto ocupa 82vw, con peek del 9vw a cada lado para sugerir swipe.
 * CSS scroll-snap nativo → inercia + alineación al soltar. Cero JS para
 * el comportamiento; el JS solo detecta el índice actual para la pagination
 * indicator. Tap en una foto → abre el lightbox. */
/* Posiciones del stack según el offset desde la card actual.
 * 0 = al frente (en escala completa, sin rotación)
 * 1 = peek detrás-derecha (rotada ligeramente clockwise)
 * 2 = peek detrás-izquierda (rotada counter-clockwise, más chica)
 * 3+ = oculta atrás (apilada para "appear" cuando llegue el turno) */
function stackPosition(offset: number) {
  if (offset === 0) return { x: '0%', y: '0%', scale: 1, rotate: 0, opacity: 1, zIndex: 30 }
  if (offset === 1) return { x: '14%', y: '-4%', scale: 0.93, rotate: 4, opacity: 1, zIndex: 25 }
  if (offset === 2) return { x: '-10%', y: '-7%', scale: 0.86, rotate: -3, opacity: 0.95, zIndex: 20 }
  if (offset === 3) return { x: '6%', y: '-10%', scale: 0.78, rotate: 2, opacity: 0.6, zIndex: 15 }
  // Más atrás: ocultas pero presentes para drag-back
  return { x: '0%', y: '-12%', scale: 0.72, rotate: 0, opacity: 0, zIndex: 10 }
}

function GalleryMobileCarousel({
  photos,
  onPhotoClick,
}: {
  photos: string[]
  onPhotoClick: (index: number) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  // Track si hubo drag para distinguir tap vs swipe
  const dragOccurred = useRef(false)

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % photos.length)
  }, [photos.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length)
  }, [photos.length])

  return (
    <motion.div
      className="md:hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Stage del stack — perspective + overflow visible para que las cards
          de atrás puedan asomarse fuera del contenedor visualmente. */}
      <div
        className="relative mx-auto"
        style={{
          width: 'min(82vw, 380px)',
          aspectRatio: '3 / 4',
          perspective: '1400px',
        }}
      >
        {photos.map((src, i) => {
          // Offset cíclico para que el stack se vea continuo (las cards
          // "viejas" se reciclan al fondo del stack visualmente)
          const rawOffset = i - currentIndex
          const offset = ((rawOffset % photos.length) + photos.length) % photos.length
          // CRÍTICO PARA PERFORMANCE: solo renderizar las 4 cards visibles
          // (current + 3 peeking detrás). Antes se renderizaban las 25
          // simultáneamente → 25 motion.divs + 25 img tags + 25 springs.
          // Ahora solo 4 → 84% menos trabajo de GPU/CPU/red.
          if (offset > 3) return null
          const pos = stackPosition(offset)
          const isFront = offset === 0

          const openLightboxAtCurrent = () => {
            track({ type: 'click', target: 'view_gallery' })
            onPhotoClick(currentIndex)
          }

          return (
            <motion.div
              key={src}
              className="absolute inset-0"
              animate={pos}
              transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 0.8 }}
              style={{ transformOrigin: 'center center', willChange: 'transform, opacity' }}
              drag={isFront ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.45}
              onDragStart={() => { dragOccurred.current = false }}
              onDrag={(_, info) => {
                // Threshold subido a 12px → en touch screens el dedo se
                // mueve algunos pixels al "tapear" por su área de contacto.
                // 6px era muy estricto y mataba todos los taps.
                if (Math.abs(info.offset.x) > 12) dragOccurred.current = true
              }}
              onDragEnd={(_, info) => {
                const swipeThreshold = 80
                const velocityThreshold = 500
                if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                  goNext()
                } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                  goPrev()
                }
              }}
              // onTap es de Framer (no React onClick): respeta drag vs tap
              // nativamente sin necesidad del flag dragOccurred. Fires solo
              // si NO hubo drag significativo.
              onTap={() => {
                if (isFront && !dragOccurred.current) {
                  openLightboxAtCurrent()
                }
              }}
            >
              {/* Polaroid: borde crema con padding desigual (más abajo,
                  donde tradicionalmente iría la escritura a mano) */}
              <div
                className="w-full h-full p-3 pb-12 rounded-md"
                style={{
                  background: '#f4ede0',
                  boxShadow: isFront
                    ? '0 24px 60px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.08)'
                    : '0 18px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.08)',
                  /* Sutil grain de papel envejecido */
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.6  0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"), linear-gradient(180deg, #f7f1e4 0%, #ede4d2 100%)`,
                  backgroundBlendMode: 'multiply',
                  cursor: isFront ? 'grab' : 'default',
                }}
              >
                <div className="relative w-full h-full overflow-hidden rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover block"
                    // Eager para las 4 cards visibles. Como ahora solo
                    // renderizamos 4, no hay riesgo de saturar la red.
                    // El bug del 'sino interrogación' venía de loading=lazy
                    // en cards que entraban dinámicamente al swipear y la
                    // imagen no se cargaba a tiempo.
                    loading="eager"
                    decoding="async"
                    fetchPriority={isFront ? 'high' : 'auto'}
                    draggable={false}
                  />
                  {/* Botón EXPANDIR — real button independiente del drag.
                      stopPropagation evita que el motion.div intercepte el
                      tap como gesture de drag. */}
                  {isFront && (
                    <button
                      type="button"
                      aria-label="Ver foto en grande"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        openLightboxAtCurrent()
                      }}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(7,5,8,0.65)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Hint sutil "← Deslizá →" debajo de la pila */}
      <div className="text-center mt-5 mb-1">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
          ← Deslizá las fotos →
        </p>
      </div>

      {/* Pagination: contador + dots */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <span className="font-mono text-xs tracking-widest text-white/50">
          {String(currentIndex + 1).padStart(2, '0')}
          <span className="text-white/20"> / </span>
          {String(photos.length).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className="h-[3px] rounded-full"
              aria-label={`Ir a foto ${i + 1}`}
              style={{
                width: currentIndex === i ? 22 : 6,
                background: currentIndex === i
                  ? 'linear-gradient(90deg, rgba(139,60,247,1), rgba(196,82,255,1))'
                  : 'rgba(255,255,255,0.2)',
                boxShadow: currentIndex === i ? '0 0 8px rgba(139,60,247,0.6)' : 'none',
                transition: 'width 0.3s ease-out, background 0.3s ease-out, box-shadow 0.3s ease-out',
                border: 0,
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function ScreenAmbientBg({ accent = 'purple' }: { accent?: 'purple' | 'orange' | 'white' }) {
  // Auroras solo animan cuando el bg está en (o cerca de) viewport.
  // Antes corrían infinito en las 4 secciones que usan este componente,
  // saturando el frame budget durante la navegación con Lenis.
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { margin: '200px 0px' })

  // Paletas por accent. White usa opacidades más bajas porque el blanco
  // puro satura rápido contra el fondo #070508 (overwhites el grain/scanlines).
  const palette = {
    purple: {
      dotMobile: 'rgba(139,60,247,0.28)', dotDesktop: 'rgba(139,60,247,0.18)',
      leftP: 'rgba(139,60,247,0.32)',     leftS: 'rgba(196,82,255,0.18)',
      rightP: 'rgba(196,82,255,0.28)',    rightS: 'rgba(139,60,247,0.16)',
    },
    orange: {
      dotMobile: 'rgba(255,140,50,0.26)', dotDesktop: 'rgba(255,140,50,0.16)',
      leftP: 'rgba(255,140,50,0.34)',     leftS: 'rgba(255,180,80,0.18)',
      rightP: 'rgba(255,200,80,0.30)',    rightS: 'rgba(255,140,50,0.16)',
    },
    // "Luz de luna" — frío azul-cian, lo suficientemente cromático para que
    // el aurora se lea contra el #070508 (un blanco puro al mismo nivel se
    // pierde en el grain). Opacidades ~mismo nivel que purple/orange.
    white: {
      dotMobile: 'rgba(200,220,255,0.22)', dotDesktop: 'rgba(200,220,255,0.14)',
      leftP: 'rgba(160,200,255,0.30)',     leftS: 'rgba(210,225,255,0.16)',
      rightP: 'rgba(190,215,255,0.26)',    rightS: 'rgba(150,190,240,0.14)',
    },
  }[accent]

  const dotColorMobile = palette.dotMobile
  const dotColorDesktop = palette.dotDesktop
  const leftPrimary = palette.leftP
  const leftSecondary = palette.leftS
  const rightPrimary = palette.rightP
  const rightSecondary = palette.rightS

  // Columnas de luz: 3 radial-gradients distribuidos verticalmente (15%, 50%,
  // 85%) dentro de un elemento que abarca la altura completa de la sección.
  // Esto hace que SIEMPRE haya luz visible mientras hagas scroll, incluso en
  // mobile donde las secciones son muy altas (gallery, libro con masonry).
  const leftColumnBg = `
    radial-gradient(ellipse 70% 30% at 50% 15%, ${leftPrimary} 0%, transparent 70%),
    radial-gradient(ellipse 75% 32% at 50% 50%, ${leftSecondary} 0%, transparent 70%),
    radial-gradient(ellipse 70% 30% at 50% 85%, ${leftPrimary} 0%, transparent 70%)
  `
  const rightColumnBg = `
    radial-gradient(ellipse 70% 30% at 50% 20%, ${rightPrimary} 0%, transparent 70%),
    radial-gradient(ellipse 75% 32% at 50% 55%, ${rightSecondary} 0%, transparent 70%),
    radial-gradient(ellipse 70% 30% at 50% 88%, ${rightPrimary} 0%, transparent 70%)
  `

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" aria-hidden style={{ zIndex: 0 }}>
      {/* Dot grid con vignette radial — intensidad responsive vía CSS class */}
      <div
        className="absolute inset-0 screen-bg-dotgrid"
        style={{
          ['--dot-color' as string]: dotColorMobile,
          ['--dot-color-desktop' as string]: dotColorDesktop,
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 78%)',
          maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 78%)',
        } as React.CSSProperties}
      />

      {/* Aurora LEFT — columna de luz que abarca toda la altura de la sección.
          3 puntos de glow distribuidos vertically + blur global → continuidad
          de iluminación mientras el usuario scrollea por la sección.
          animate gated por inView + blur responsive vía .screen-bg-aurora
          (mobile: 28px, desktop: 45px). */}
      <motion.div
        className="absolute screen-bg-aurora"
        style={{
          top: 0,
          bottom: 0,
          left: '-15%',
          width: 'min(70vmin, 720px)',
          background: leftColumnBg,
          willChange: 'transform, opacity',
        }}
        animate={inView ? { scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] } : undefined}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Aurora RIGHT — columna simétrica, ritmo desincronizado, puntos de
          glow ligeramente offset para que no se vea espejado perfecto. */}
      <motion.div
        className="absolute screen-bg-aurora"
        style={{
          top: 0,
          bottom: 0,
          right: '-15%',
          width: 'min(70vmin, 720px)',
          background: rightColumnBg,
          willChange: 'transform, opacity',
        }}
        animate={inView ? { scale: [1.05, 0.95, 1.05], opacity: [0.65, 0.95, 0.65] } : undefined}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* Scanlines tipo CRT — intensidad responsive vía CSS class */}
      <div className="absolute inset-0 screen-bg-scanlines" style={{ mixBlendMode: 'overlay' }} />

      {/* Film grain SVG — opacity responsive vía CSS class */}
      <div className="absolute inset-0 screen-bg-grain" style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        backgroundSize: '200px 200px',
        mixBlendMode: 'overlay',
      }} />

      {/* Vignette inferior — funde con la siguiente sección */}
      <div className="absolute inset-x-0 bottom-0 h-32" style={{
        background: 'linear-gradient(to top, #070508 0%, rgba(7,5,8,0.5) 40%, transparent 100%)',
      }} />
      {/* Vignette superior — funde con la sección anterior */}
      <div className="absolute inset-x-0 top-0 h-24" style={{
        background: 'linear-gradient(to bottom, #070508 0%, rgba(7,5,8,0.4) 50%, transparent 100%)',
      }} />
    </div>
  )
}

/* ── Chrome de ventana macOS ─────────────────────────────────────────────
 * Wrap reutilizable: traffic lights (R/Y/G) + URL pill centrada con icono
 * de candado. Da sensación de "screen showcase" estilo Apple/Linear/Framer. */
function MacWindow({
  url = 'pipesantos.com',
  children,
  className,
}: {
  url?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div
        className="relative flex items-center px-3.5 md:px-4 py-2.5 md:py-3"
        style={{
          background: 'linear-gradient(180deg, #2a2630 0%, #1f1c25 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className="block rounded-full" style={{ width: 12, height: 12, background: '#FF5F57', boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.15)' }} />
          <span className="block rounded-full" style={{ width: 12, height: 12, background: '#FEBC2E', boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.15)' }} />
          <span className="block rounded-full" style={{ width: 12, height: 12, background: '#28C840', boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.15)' }} />
        </div>

        {/* URL pill centrada */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-md"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.04)',
            maxWidth: '60%',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.4" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span className="font-mono text-[10px] md:text-[11px] tracking-wider truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {url}
          </span>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ── Wrapper con escala ligada al scroll ────────────────────────────────
 * El hijo crece a medida que entra al viewport, alcanza su tamaño máximo
 * cuando está centrado, y se achica al salir. Sutil (0.9 → 1 → 0.9). */
function ScrollScale({
  children,
  className,
  style,
  scaleRange = [0.78, 1.04, 0.78],
  opacityRange = [0.3, 1, 1, 0.3],
  offset = ['start end', 'end start'],
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  scaleRange?: [number, number, number]
  opacityRange?: [number, number, number, number]
  // Cuándo arranca y termina el efecto respecto al viewport.
  // Default = transit completo (entrar por abajo → salir por arriba).
  offset?: Array<string | number>
}) {
  const ref = useRef<HTMLDivElement>(null)
  // prefers-reduced-motion: desactivamos el efecto completamente (sin springs/rAFs).
  // ~20% de usuarios mobile lo tiene activado; ahorrarles los hooks reduce CPU.
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    offset: offset as any,
  })
  // Suavizado con spring para evitar tirones en scroll rápido
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 })
  const scale = useTransform(smooth, [0, 0.5, 1], scaleRange)
  const opacity = useTransform(smooth, [0, 0.3, 0.7, 1], opacityRange)

  if (reduced) {
    return <div className={className} style={style}>{children}</div>
  }
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, scale, opacity, willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}

export default function PreviewPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [contactError, setContactError] = useState('')
  const [showReaderGallery, setShowReaderGallery] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [pipeMsgIndex, setPipeMsgIndex] = useState(0)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showFlyer, setShowFlyer] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Lock body scroll mientras el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  // ESC para cerrar el menú
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen])
  const [eventSold, setEventSold] = useState(0)
  const countdown = useCountdown()
  // urgencyMessage: dinámico según ticket-count. Se recalcula cada vez
  // que eventSold cambia (initial fetch + cron de cleanup).
  const urgency = getUrgencyMessage(eventSold)
  useEffect(() => {
    fetch('/api/ticket-count').then(r => r.json()).then(d => setEventSold(d.count || 0)).catch(() => {})
  }, [])

  // ── Analítica: page_view + tiempo por sección ──────────────────────────
  useEffect(() => {
    track({ type: 'page_view' })

    const enters = new Map<string, number>()
    const observer = new IntersectionObserver(entries => {
      const now = Date.now()
      for (const entry of entries) {
        const name = (entry.target as HTMLElement).dataset.trackSection
        if (!name) continue
        if (entry.isIntersecting) {
          if (!enters.has(name)) enters.set(name, now)
        } else if (enters.has(name)) {
          const duration = now - (enters.get(name) ?? now)
          enters.delete(name)
          if (duration > 500 && duration < 600_000) {
            track({ type: 'section_time', section: name, duration_ms: duration })
          }
        }
      }
    }, { threshold: 0.5 })

    const els = document.querySelectorAll<HTMLElement>('[data-track-section]')
    els.forEach(el => observer.observe(el))

    const flushActive = () => {
      const now = Date.now()
      enters.forEach((enterTime, name) => {
        const duration = now - enterTime
        if (duration > 500 && duration < 600_000) {
          track({ type: 'section_time', section: name, duration_ms: duration })
        }
      })
      enters.clear()
    }
    const onHide = () => { if (document.visibilityState === 'hidden') flushActive() }
    window.addEventListener('pagehide', flushActive)
    document.addEventListener('visibilitychange', onHide)

    return () => {
      flushActive()
      observer.disconnect()
      window.removeEventListener('pagehide', flushActive)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  // Rotación de palabras en el hero
  const HERO_WORDS = ['Conectando', 'Inspirando', 'Construyendo', 'Sumando']
  const [heroWordIdx, setHeroWordIdx] = useState(0)
  const heroWordCycled = useRef(false)
  useEffect(() => {
    const id = setInterval(() => {
      heroWordCycled.current = true
      setHeroWordIdx(i => (i + 1) % HERO_WORDS.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])
  const heroRef = useRef<HTMLElement>(null)
  const heroParallaxRef = useRef<HTMLDivElement>(null)
  const socialRef = useRef<HTMLElement>(null)
  const socialInView = useInView(socialRef, { once: false, margin: '0px 0px -80px 0px' })
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })

  // Parallax del hero: scroll + mouse calculados en un solo rAF.
  // Leemos scroll position DIRECTAMENTE cada frame (sincronizado con Lenis)
  // en lugar de useMotionValueEvent → evita el efecto "escalonado" al combinar
  // un valor discreto con un loop continuo. Pixels puros + translate3d → GPU.
  const heroMouse = useRef({ x: 0, y: 0 })
  const heroMouseSmooth = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const isFinePointer = window.matchMedia('(pointer: fine)').matches

    const onMove = (e: MouseEvent) => {
      heroMouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      heroMouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    if (isFinePointer) {
      window.addEventListener('mousemove', onMove, { passive: true })
    }

    let rafId = 0
    let running = false
    const loop = () => {
      const parEl = heroParallaxRef.current
      const heroEl = heroRef.current
      if (parEl && heroEl) {
        const rect = heroEl.getBoundingClientRect()
        const scrolled = Math.max(0, -rect.top)
        const progress = Math.min(1, rect.height > 0 ? scrolled / rect.height : 0)
        const ty = progress * rect.height * 0.3

        let mx = 0, my = 0
        if (isFinePointer) {
          heroMouseSmooth.current.x += (heroMouse.current.x - heroMouseSmooth.current.x) * 0.08
          heroMouseSmooth.current.y += (heroMouse.current.y - heroMouseSmooth.current.y) * 0.08
          mx = heroMouseSmooth.current.x * 12
          my = heroMouseSmooth.current.y * 8
        }
        parEl.style.transform = `translate3d(${mx}px, ${ty + my}px, 0) scale(1.15)`
      }
      rafId = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running) return
      running = true
      rafId = requestAnimationFrame(loop)
    }
    const stop = () => {
      if (!running) return
      running = false
      cancelAnimationFrame(rafId)
    }

    // Solo correr el rAF cuando el hero esté en (o cerca de) viewport.
    // Una vez scrolleaste pasado el hero, no hay nada que actualizar.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start()
        else stop()
      },
      { rootMargin: '100px' },
    )
    if (heroRef.current) io.observe(heroRef.current)
    start()  // arranque inicial mientras IO procesa

    return () => {
      io.disconnect()
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])
  const openLightbox = (i: number) => { setLightboxIndex(i); document.body.style.overflow = 'hidden' }
  const closeLightbox = useCallback(() => { setLightboxIndex(null); document.body.style.overflow = '' }, [])
  const prevPhoto = useCallback(() => setLightboxIndex(i => i === null ? null : (i - 1 + galleryPhotos.length) % galleryPhotos.length), [])
  const nextPhoto = useCallback(() => setLightboxIndex(i => i === null ? null : (i + 1) % galleryPhotos.length), [])

  async function handleContact() {
    track({ type: 'click', target: 'send_message' })
    setContactStatus('loading')
    setContactError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setContactError(data.error ?? 'Error al enviar. Intenta de nuevo.')
        setContactStatus('error')
      } else {
        setContactStatus('ok')
        setForm({ name: '', email: '', message: '' })
      }
    } catch {
      setContactError('Error de conexión. Intenta de nuevo.')
      setContactStatus('error')
    }
  }

  return (
    <main className="grain min-h-screen overflow-x-hidden" style={{ background: '#070508' }}>
      <IntroOverlay />
      <Particles />

      {showEventModal && <EventoModal onClose={() => setShowEventModal(false)} sold={eventSold} />}
      {showFlyer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(7,5,8,0.92)', backdropFilter: 'blur(12px)' }}
          onClick={() => setShowFlyer(false)}
        >
          <div className="relative max-h-[90vh] max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowFlyer(false)}
              className="absolute -top-10 right-0 font-mono text-white/50 hover:text-white text-sm tracking-widest"
            >
              ✕ cerrar
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/evento-flyer-v2.jpg"
              alt="La vida es cule viaje — Barranquilla 2026"
              className="w-full h-auto rounded-2xl"
              style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(196,82,0,0.2)' }}
            />
          </div>
        </div>
      )}
      {showReaderGallery && <ReaderGalleryModal onClose={() => setShowReaderGallery(false)} />}

      {lightboxIndex !== null && (
        <Lightbox
          photos={galleryPhotos}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}

      {/* ── NAV ─────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center md:justify-between items-center px-4 md:px-12 py-3 md:py-4"
        style={{ background: 'linear-gradient(to bottom, rgba(7,5,8,0.95), transparent)', backdropFilter: 'blur(10px)' }}>
        <Image src="/logo-header-v2.png" alt="Pipe Santos" width={300} height={130} className="h-11 md:h-16 w-auto opacity-90" priority />
        <div className="hidden md:flex gap-8">
          {[['#sobre', 'Sobre mí'], ['#galeria', 'Galería'], ['#libro', 'Mi libro'], ['#podcast', 'Podcast'], ['#testimonios', 'Testimonios'], ['#contacto', 'Contacto']].map(([href, label]) => (
            <a key={label} href={href} className="font-mono text-xs tracking-widest text-white/40 hover:text-white uppercase transition-colors">{label}</a>
          ))}
        </div>

        {/* Hamburger (solo mobile) — visible cuando el menú está CERRADO.
            Cuando se abre se oculta y el botón X del overlay toma protagonismo. */}
        <motion.button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={mobileMenuOpen}
          className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex flex-col items-center justify-center gap-[5px] rounded-full"
          style={{ zIndex: 70 }}
          animate={{ opacity: mobileMenuOpen ? 0 : 1, pointerEvents: mobileMenuOpen ? 'none' : 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <span className="block bg-white rounded-full" style={{ width: 22, height: 2 }} />
          <span className="block bg-white rounded-full" style={{ width: 22, height: 2 }} />
          <span className="block bg-white rounded-full" style={{ width: 22, height: 2 }} />
        </motion.button>
      </nav>

      {/* ── MENÚ MÓVIL OVERLAY ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
            style={{
              zIndex: 60,
              background: 'rgba(7,5,8,0.97)',  // 97% opaco → backdrop-filter casi imperceptible
              backdropFilter: 'blur(10px)',     // bajado de 24px → 10px, ahorra mucho en Android
              WebkitBackdropFilter: 'blur(10px)',
              touchAction: 'none',
              overscrollBehavior: 'contain',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Misma interferencia que en la sección del libro (LEFT + RIGHT
                auroras laterales full-height + dot grid + scanlines CRT +
                grain + vignettes). Variante 'purple' para mantener identidad
                de marca en lugar del naranja del libro. */}
            <ScreenAmbientBg />

            {/* Botón X dedicado para cerrar — top-right inside overlay,
                con icono SVG claro + label "CERRAR" debajo para que cualquier
                usuario entienda. Glass + glow morado para que destaque. */}
            <motion.button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-4 right-4 z-20 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(139,60,247,0.18)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(196,82,255,0.55)',
                  boxShadow: '0 0 24px rgba(139,60,247,0.55), inset 0 0 12px rgba(196,82,255,0.18)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </div>
              <span className="font-mono text-[9px] tracking-[0.32em] uppercase mt-1.5"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Cerrar
              </span>
            </motion.button>

            {/* Logo del header arriba del Inicio — entra primero con fade+scale.
                Sirve como anchor visual de marca y como confirmación de que
                estás en el menú principal. */}
            <motion.div
              className="relative z-10 mb-4"
              initial={{ opacity: 0, y: -10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src="/logo-header-v2.png"
                alt="Pipe Santos"
                width={300}
                height={130}
                className="h-14 w-auto opacity-95"
                style={{ filter: 'drop-shadow(0 0 18px rgba(139,60,247,0.35))' }}
                priority
              />
            </motion.div>

            {/* Separador 'MENÚ' — diferencia el logo (marca) de la navegación
                que viene abajo. Líneas degradadas + label mono → clara
                jerarquía visual. */}
            <motion.div
              className="relative z-10 flex items-center gap-3 mb-7"
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="block h-[1px] w-14"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(139,60,247,0.7))' }}
              />
              <span
                className="block w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'rgba(139,60,247,1)',
                  boxShadow: '0 0 10px rgba(139,60,247,0.8), 0 0 20px rgba(196,82,255,0.5)',
                }}
              />
              <span className="font-mono text-[10px] tracking-[0.45em] uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Menú
              </span>
              <span
                className="block w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'rgba(139,60,247,1)',
                  boxShadow: '0 0 10px rgba(139,60,247,0.8), 0 0 20px rgba(196,82,255,0.5)',
                }}
              />
              <span
                className="block h-[1px] w-14"
                style={{ background: 'linear-gradient(270deg, transparent, rgba(139,60,247,0.7))' }}
              />
            </motion.div>

            {/* Links — fade-up staggered. 'Inicio' removido porque el botón X
                arriba ya cumple la función de cerrar el menú (que es
                equivalente a "volver al hero" si el usuario abrió desde ahí). */}
            <nav className="relative z-10 flex flex-col items-center gap-6">
              {([
                ['#sobre', 'Sobre mí'],
                ['#galeria', 'Galería'],
                ['#libro', 'Mi libro'],
                ['#podcast', 'Podcast'],
                ['#testimonios', 'Testimonios'],
                ['#evento', 'Evento'],
                ['#contacto', 'Contacto'],
              ] as const).map(([href, label], i) => (
                <motion.a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-3xl text-white relative group"
                >
                  <span>{label}</span>
                  {/* Underline sutil que aparece al tap */}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-[2px] w-0 group-hover:w-full group-focus:w-full transition-all duration-300 rounded-full"
                    style={{ background: 'linear-gradient(90deg, rgba(139,60,247,1), rgba(196,82,255,1))', boxShadow: '0 0 12px rgba(139,60,247,0.7)' }}
                  />
                </motion.a>
              ))}
            </nav>

            {/* Footer mini con el handle social */}
            <motion.div
              className="absolute bottom-10 left-0 right-0 flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/30">
                pipesantos.com
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────── */}
      <section ref={heroRef} data-track-section="hero" className="relative min-h-screen flex flex-col justify-start overflow-hidden">
        {/* Background photo con parallax — next/image servida por tamaño de viewport (mobile=750px, desktop=2400px) */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Wrapper que se desplaza con parallax aplicado vía ref imperativo (no motion.div para no conflictuar con Image) */}
          <div
            ref={heroParallaxRef}
            className="absolute inset-0"
            style={{ transform: 'scale(1.15)', willChange: 'transform' }}
          >
            {/* Adaptive HD con srcset por DPR + WebP + JPG fallback.
                Cada device descarga EXACTAMENTE la resolución que necesita:

                Mobile (portrait crop, <768px):
                - DPR 2 (iPhone 8, Android mid):  hero-mobile-2x.webp (439KB)
                - DPR 3+ (iPhone Pro, Galaxy S):  hero-mobile-3x.webp (805KB)

                Desktop (landscape, ≥768px):
                - DPR 1 (display estándar):        hero-desktop-1x.webp (342KB)
                - DPR 2 (Mac Retina):              hero-desktop-2x.webp (600KB)

                Browser usa <picture>/<source>/srcset para elegir.
                Ningún device descarga más de lo que necesita. */}
            <picture>
              {/* Desktop ≥768px */}
              <source
                media="(min-width: 768px)"
                type="image/webp"
                srcSet="/hero-desktop-1x.webp 1x, /hero-desktop-2x.webp 2x"
              />
              <source
                media="(min-width: 768px)"
                type="image/jpeg"
                srcSet="/hero-desktop-1x.jpg 1x, /hero-desktop-2x.jpg 2x"
              />
              {/* Mobile <768px */}
              <source
                type="image/webp"
                srcSet="/hero-mobile-2x.webp 2x, /hero-mobile-3x.webp 3x"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-mobile-2x.jpg"
                srcSet="/hero-mobile-2x.jpg 2x, /hero-mobile-3x.jpg 3x"
                alt=""
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </div>
          {/* Gradiente diagonal: oscuro arriba-izquierda donde está el texto, transparente abajo */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(155deg, rgba(7,5,8,0.97) 0%, rgba(7,5,8,0.9) 20%, rgba(7,5,8,0.4) 40%, transparent 58%)' }} />
          {/* Fade-to-black abajo: la imagen se difumina suavemente hacia el
              color del background de la siguiente sección (#070508) para que
              no haya línea visible entre hero y la sección de estadísticas. */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to top, rgba(7,5,8,1) 0%, rgba(7,5,8,0.95) 6%, rgba(7,5,8,0.78) 14%, rgba(7,5,8,0.5) 24%, rgba(7,5,8,0.22) 34%, transparent 44%)',
          }} />
          {/* Sombra desde arriba para cubrir el área del título y subtítulo */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,5,8,0.92) 0%, rgba(7,5,8,0.82) 30%, rgba(7,5,8,0.5) 55%, rgba(7,5,8,0.1) 75%, transparent 90%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 35%, rgba(139,60,247,0.1) 0%, transparent 50%)' }} />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 pb-16" style={{ paddingTop: '20vh' }}>
          {/* Texto — wrapper con w-full + items-start para anclar todos los hijos a la izquierda */}
          <motion.div initial="hidden" animate="visible" variants={stagger}
            className="w-full flex flex-col items-start">
            <motion.p variants={fadeUp} className="font-mono text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] text-aurora/80 uppercase mb-5">
              ◆ Conferencista · Escritor · Influencer
            </motion.p>
            <motion.h1 variants={fadeUp} data-text={HERO_WORDS[heroWordIdx]} className="glitch-crt font-display text-5xl md:text-[7rem] font-light text-white leading-none mb-0">
              {heroWordIdx === 0 && !heroWordCycled.current
                ? <ScrambleText text="Conectando" delay={2800} />
                : <span style={{ position: 'relative', zIndex: 1, color: 'white' }}>{HERO_WORDS[heroWordIdx]}</span>}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[2.3rem] md:text-6xl mb-6 whitespace-nowrap" style={{ fontFamily: 'Amsterdam, cursive', color: 'rgba(139,60,247,0.9)', textShadow: '0 2px 20px rgba(7,5,8,0.9)' }}>
              A partir de historias
            </motion.p>

            {/* ── Hero CTA: scarcity messaging dinámico + botón comprar ── */}
            <motion.a
              variants={fadeUp}
              href="#evento"
              onClick={() => track({ type: 'click', target: 'hero_buy_cta' })}
              className={`hero-cta group hero-cta--${urgency.level}`}
              aria-label="Comprar entrada para el evento del 22 de agosto"
            >
              {/* Top: mensaje de urgencia (cambia con el nivel de venta) */}
              <span className="hero-cta__meta">
                <span className="hero-cta__pulse-dot" />
                <span>{urgency.full}</span>
              </span>
              {/* Botón */}
              <span className="hero-cta__btn">
                <span>Comprar entrada · $40.000</span>
                <svg className="hero-cta__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7"/>
                </svg>
              </span>
            </motion.a>
          </motion.div>
        </div>

        {/* ── Burbuja MOBILE (sin cambios) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pipeMsgIndex}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden absolute z-30 px-4 py-2 rounded-2xl text-sm font-body font-medium text-white whitespace-nowrap pointer-events-none"
            style={{
              bottom: '20%',
              right: '34%',
              background: 'rgba(139,60,247,0.18)',
              border: '1px solid rgba(139,60,247,0.55)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 24px rgba(139,60,247,0.28)',
            }}
          >
            {pipeMessages[pipeMsgIndex]}
            <div className="absolute top-1/2 -translate-y-1/2 -right-[9px] w-4 h-4 rotate-45"
              style={{ background: 'rgba(139,60,247,0.18)', borderRight: '1px solid rgba(139,60,247,0.55)', borderTop: '1px solid rgba(139,60,247,0.55)' }}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── Burbuja DESKTOP — pegada al personaje ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`desk-${pipeMsgIndex}`}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:block absolute z-30 px-4 py-2 rounded-2xl text-sm font-body font-medium text-white whitespace-nowrap pointer-events-none"
            style={{
              bottom: '44%',
              right: '15%',
              background: 'rgba(139,60,247,0.18)',
              border: '1px solid rgba(139,60,247,0.55)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 24px rgba(139,60,247,0.28)',
            }}
          >
            {pipeMessages[pipeMsgIndex]}
            <div className="absolute top-1/2 -translate-y-1/2 -right-[9px] w-4 h-4 rotate-45"
              style={{ background: 'rgba(139,60,247,0.18)', borderRight: '1px solid rgba(139,60,247,0.55)', borderTop: '1px solid rgba(139,60,247,0.55)' }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Pipe asomándose desde el borde derecho */}
        <div className="absolute right-0 bottom-0 z-20" style={{ transform: 'translateX(28%)' }}>
          <WavingPipe onAvatarClick={() => setPipeMsgIndex(i => (i + 1) % pipeMessages.length)} />
        </div>

        {/* Indicador "descubre más" — desaparece cuando empiezas a scrollear */}
        <ScrollHint />
      </section>

      {/* ── ESTADÍSTICAS ─────────────────────────── */}
      <section ref={socialRef} data-track-section="social" className="relative z-10 px-6 md:px-12 py-20 overflow-hidden">
        {/* Fondo animado: orbes de luz flotando + grid sutil */}
        <SocialSectionBg active={socialInView} />
        <HeartParticles active={socialInView} />
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div className="flex justify-start mb-14" style={{ marginLeft: '-12%' }} initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
            <Image
              src="/comunidad-logo.png"
              alt="Conoce mi comunidad"
              width={420}
              height={160}
              className="w-full max-w-sm md:max-w-lg h-auto"
            />
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">

            {/* TikTok */}
            <ScrollScale offset={['start 2', 'end -0.5']}>
              <Tilt3D className="glass rounded-2xl p-6 md:p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all social-card-3d">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                </svg>
              </div>
              <p className="font-mono text-xs tracking-widest text-white/30 uppercase mb-2">TikTok</p>
              <p className="font-display text-4xl font-light text-white mb-1"><SocialCount target={235} /></p>
              <p className="font-mono text-xs text-white/30 tracking-wider">seguidores</p>
              <p className="font-body text-white/40 text-sm leading-relaxed mt-5 text-left">
                Los números hablan por sí mismos: publicaciones virales, un alto nivel de interacción y una comunidad que no deja de expandirse.
              </p>
              <p className="font-body text-white/50 text-sm leading-relaxed mt-3 text-left">
                💥 Mi comunidad es grande, sólida y altamente comprometida. Su apoyo es la razón principal detrás de este crecimiento orgánico.
              </p>
              <a href="https://tiktok.com/@pipesantos93" target="_blank" rel="noopener noreferrer"
                className="social-pill group/link mt-5">
                <span>@pipesantos93</span>
                <svg className="social-pill-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M9 7h8v8"/>
                </svg>
              </a>
              </Tilt3D>
            </ScrollScale>

            {/* Instagram */}
            <ScrollScale offset={['start 2', 'end -0.5']}>
              <Tilt3D
                className="glass rounded-2xl p-6 md:p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all relative social-card-3d"
                style={{ overflow: 'visible' }}
              >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <p className="font-mono text-xs tracking-widest text-white/30 uppercase mb-2">Instagram</p>
              <p className="font-display text-4xl font-light text-white mb-1"><SocialCount target={163} /></p>
              <p className="font-mono text-xs text-white/30 tracking-wider">seguidores</p>
              <p className="font-body text-white/40 text-sm leading-relaxed mt-5 text-left">
                En Instagram cada publicación tiene un propósito: decir mucho en poco espacio. Reels, frases y momentos cargados de intención que generan impacto inmediato.
              </p>
              <p className="font-body text-white/50 text-sm leading-relaxed mt-3 text-left">
                ✦ Contenido corto, directo y contundente — diseñado para detener el scroll y mover algo por dentro.
              </p>
              {/* Pipe sentado en el borde inferior derecho de la caja */}
              {/* Capa 1: posición fija en el borde (CSS puro, sin Framer) */}
              <div className="absolute pointer-events-none" style={{ width: 'clamp(118px, 14vw, 162px)', bottom: 0, right: '-6px', transform: 'translateY(50%)', zIndex: 10 }}>
                {/* Capa 2: entrada */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ position: 'relative' }}
                >
                  {/* Capa 3: flotación suave */}
                  <motion.div
                    animate={{ y: [0, -9, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  >
                    <TransparentImg
                      src="/pipe-social.png"
                      style={{ filter: 'drop-shadow(-4px 8px 20px rgba(0,0,0,0.55))' }}
                    />
                  </motion.div>

                  {/* Partículas */}
                  <motion.div className="absolute top-4 -left-4 w-2 h-2 rounded-full pointer-events-none"
                    style={{ background: 'rgba(139,60,247,0.7)' }}
                    animate={{ y: [-5, 5, -5], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                  />
                  <motion.div className="absolute top-10 -right-3 w-1.5 h-1.5 rounded-full pointer-events-none"
                    style={{ background: 'rgba(255,140,66,0.65)' }}
                    animate={{ y: [4, -4, 4], opacity: [0.5, 0.9, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3.1, ease: 'easeInOut' }}
                  />
                  <motion.div className="absolute top-20 -left-2 w-1.5 h-1.5 rounded-full pointer-events-none"
                    style={{ background: 'rgba(139,60,247,0.45)' }}
                    animate={{ y: [-7, 7, -7], opacity: [0.45, 0.85, 0.45] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  />
                  <motion.div className="absolute -top-1 left-1/3 w-1.5 h-1.5 rounded-full pointer-events-none"
                    style={{ background: 'rgba(255,200,50,0.55)' }}
                    animate={{ y: [3, -6, 3], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.7, ease: 'easeInOut' }}
                  />
                </motion.div>
              </div>
              <a href="https://instagram.com/pipesantos93" target="_blank" rel="noopener noreferrer"
                className="social-pill group/link mt-5">
                <span>@pipesantos93</span>
                <svg className="social-pill-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M9 7h8v8"/>
                </svg>
              </a>
              </Tilt3D>
            </ScrollScale>

            {/* Facebook — intensidad reducida para que no se achique tanto al final */}
            <ScrollScale
              scaleRange={[0.92, 1.02, 0.92]}
              opacityRange={[0.6, 1, 1, 0.6]}
              offset={['start 2', 'end -0.5']}
            >
              <Tilt3D className="glass rounded-2xl p-6 md:p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all social-card-3d">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <p className="font-mono text-xs tracking-widest text-white/30 uppercase mb-2">Facebook</p>
              <p className="font-display text-4xl font-light text-white mb-1"><SocialCount target={544} /></p>
              <p className="font-mono text-xs text-white/30 tracking-wider">seguidores</p>
              <p className="font-body text-white/40 text-sm leading-relaxed mt-5 text-left">
                La narrativa es el lenguaje universal que rompe fronteras. En Facebook, las historias de Pipe Santos conectan con personas de distintas culturas, países y realidades.
              </p>
              <p className="font-body text-white/50 text-sm leading-relaxed mt-3 text-left">
                🌎 Una comunidad internacional unida por algo poderoso: la fuerza de una historia bien contada.
              </p>
              <a href="https://www.facebook.com/untalpipesantos" target="_blank" rel="noopener noreferrer"
                className="social-pill group/link mt-5">
                <span>Pipe Santos</span>
                <svg className="social-pill-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M9 7h8v8"/>
                </svg>
              </a>
              </Tilt3D>
            </ScrollScale>

          </div>
        </div>
      </section>

      {/* ── SHOWREEL ─────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20 overflow-hidden">
        <ScreenAmbientBg />
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Showreel</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-3">
              Mira lo que pasa en <span className="italic" style={{ color: 'rgba(139,60,247,0.85)' }}>mis eventos</span>
            </h2>
            <p className="font-body text-white/40 max-w-md mx-auto">
              Una experiencia única que transforma audiencias y deja huella.
            </p>
          </motion.div>

          <ScrollScale
            className="relative rounded-2xl overflow-hidden"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(139,60,247,0.08)',
            }}
            scaleRange={[0.93, 1.02, 0.93]}
            opacityRange={[0.7, 1, 1, 0.7]}
          >
            {/* Halo morado sutil detrás de la ventana */}
            <div className="absolute -inset-1 rounded-2xl" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(139,60,247,0.12) 0%, transparent 70%)', zIndex: -1 }} />

            <MacWindow url="pipesantos.com/eventos">
              <video
                controls
                playsInline
                preload="metadata"
                poster="/showreel-poster.jpg"
                className="w-full block"
                style={{ maxHeight: '600px', background: '#070508' }}
              >
                <source src="/showreel.mp4" type="video/mp4" />
              </video>
            </MacWindow>
          </ScrollScale>
        </div>
      </section>

      {/* ── SOBRE MÍ ─────────────────────────────── */}
      <section id="sobre" data-track-section="sobre" className="relative z-10 px-6 md:px-12 py-20 overflow-hidden">
        {/* Video de fondo en bucle */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 1 }}
        >
          <source src="/theater.mp4" type="video/mp4" />
        </video>
        {/* Overlay oscuro para que el texto sea legible */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(7,5,8,0.65)' }} />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={slideLeft}>
              <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-6">◆ Sobre mí</p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-white leading-tight mb-8">
                Comunicador del<br />
                <span className="italic" style={{ color: 'rgba(139,60,247,0.8)' }}>Caribe Colombiano</span>
              </h2>
              <p className="font-body text-white/50 text-lg leading-relaxed mb-6">
                Soy un comunicador experto en <strong className="text-white/80">storytelling</strong>, apasionado por conectar comunidades a través de historias reales que transforman vidas.
              </p>
              <p className="font-body text-white/50 text-lg leading-relaxed">
                Como conferencista, escritor e influencer, he tenido el privilegio de impactar a miles de personas en su crecimiento personal, profesional y financiero.
              </p>
            </motion.div>
            <ScrollScale className="relative">
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.15) 0%, transparent 70%)', transform: 'scale(1.2)' }} />
              <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <div className="w-full h-full bg-cover bg-center bg-top" style={{ backgroundImage: "url('/gallery/DSC01807.jpg')" }} />
              </div>
            </ScrollScale>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pt-20 pb-10">
        <div className="max-w-5xl mx-auto">
          <SectionDivider className="mb-14" />
          <div className="relative">
            {/* ── Móvil/tablet: 3 tarjetas a ancho completo, Boris superpuesto ── */}
            <div className="lg:hidden max-w-3xl mx-auto grid grid-cols-1 gap-4">
              {/* Primera tarjeta: Boris superpuesto en el borde izquierdo */}
              <div className="relative overflow-visible">
                <StatCard num={stats[0].num} label={stats[0].label} suffix={stats[0].suffix} />
                <div
                  className="absolute z-10 pointer-events-auto"
                  style={{ left: '-14px', top: '50%', transform: 'translateY(-55%)' }}
                >
                  <BorisCharacter />
                </div>
              </div>
              {/* Resto de tarjetas — mismo ancho, sin cambios */}
              {stats.slice(1).map((s) => (
                <StatCard key={s.label} num={s.num} label={s.label} suffix={s.suffix} />
              ))}
            </div>

            {/* ── Desktop lg+: grid de 3 columnas original ── */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {stats.map((s) => (
                <StatCard key={s.label} num={s.num} label={s.label} suffix={s.suffix} />
              ))}
            </div>

            {/* Boris — desktop: flota a la izquierda del grid */}
            <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2">
              <BorisCharacter />
            </div>
          </div>
        </div>
      </section>

      {/* ── GALERÍA ──────────────────────────────── */}
      <section id="galeria" data-track-section="galeria" className="relative z-10 px-6 md:px-12 pt-4 pb-10 overflow-hidden">
        <ScreenAmbientBg />
        <div className="relative z-10 max-w-6xl mx-auto">
          <SectionDivider className="mb-14" />
          <div className="text-center mb-14">
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Eventos</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-3">
              Momentos que <span className="italic" style={{ color: 'rgba(139,60,247,0.85)' }}>inspiran</span>
            </h2>
            <p className="font-body text-white/40 max-w-md mx-auto">
              Cada evento es una historia única. Aquí algunos de esos momentos especiales.
            </p>
          </div>

          {/* Mobile: carrusel horizontal con snap-scroll y pagination */}
          <GalleryMobileCarousel photos={galleryPhotos} onPhotoClick={openLightbox} />

          {/* Desktop (md+): masonry grid con hover overlays */}
          <div className="hidden md:block columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {galleryPhotos.map((src, i) => (
              <motion.div
                key={src}
                className="break-inside-avoid relative overflow-hidden rounded-xl cursor-pointer group"
                style={{ marginBottom: '12px' }}
                onClick={() => { track({ type: 'click', target: 'view_gallery' }); openLightbox(i) }}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(139,60,247,0.45), rgba(196,82,0,0.35))' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIBRO ────────────────────────────────── */}
      <section id="libro" data-track-section="libro" className="relative z-10 px-6 md:px-12 pt-4 pb-20 overflow-hidden">
        <ScreenAmbientBg accent="orange" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionDivider className="mb-14" />
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div className="order-2 md:order-1" initial="hidden" whileInView="visible" viewport={VP} variants={slideLeft}>
              <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-6">◆ Mi libro</p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-white leading-tight mb-4">
                Lo que nunca le<br />
                <span className="italic" style={{ color: 'rgba(196,82,0,0.9)' }}>conté a papá</span>
              </h2>
              <p className="font-body text-white/50 text-lg leading-relaxed mb-2">
                Acabo de publicar mi primer libro y sé que será una gran herramienta para tu vida diaria.
              </p>
              <p className="font-mono text-xs tracking-widest mb-10" style={{ color: 'rgba(196,82,0,0.7)' }}>
                "Momentos de mi vida que cambiaron todo"
              </p>
              <div className="space-y-6 mb-10">
                {bookFeatures.map((f) => (
                  <div key={f.title} className="glass rounded-xl p-5">
                    <p className="font-body font-semibold text-white/80 mb-1">{f.title}</p>
                    <p className="font-body text-white/40 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <a href="https://wa.me/573239386709?text=Hola%20Pipe%2C%20quiero%20comprar%20tu%20libro%20%22Lo%20que%20nunca%20le%20cont%C3%A9%20a%20pap%C3%A1%22" target="_blank" rel="noopener noreferrer" onClick={() => track({ type: 'click', target: 'buy_book' })} className="btn-primary inline-block" style={{ background: 'linear-gradient(135deg, #C45200, #E07820)' }}>
                  <span>Comprar ahora</span>
                </a>
                <button
                  onClick={() => { track({ type: 'click', target: 'view_readers' }); setShowReaderGallery(true) }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-mono text-xs tracking-widest uppercase transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M19 8v6M22 11h-6"/></svg>
                  Algunos de mis lectores
                </button>
              </div>
            </motion.div>
            <ScrollScale className="order-1 md:order-2 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse, rgba(196,82,0,0.25) 0%, transparent 65%)', transform: 'scale(1.4)' }} />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: '280px', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(196,82,0,0.15)' }}>
                  <Image src="/book-cover.png" alt="Lo que nunca le conté a papá" width={280} height={400} className="w-full h-auto" />
                </div>
              </div>
            </ScrollScale>
          </div>
          <SectionDivider className="mt-16" />
        </div>
      </section>

      {/* ── PODCAST ──────────────────────────────── */}
      <section id="podcast" data-track-section="podcast" className="relative z-10 px-6 md:px-12 py-20 overflow-hidden">
        <ScreenAmbientBg />
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Podcast</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
              Escucha mi <span className="italic" style={{ color: 'rgba(139,60,247,0.8)' }}>podcast</span>
            </h2>
            <p className="font-body text-white/40 text-lg max-w-lg mx-auto">
              Aquí podrás escuchar algunas <strong className="text-white/60">historias poderosas</strong> que con mucho cariño he producido para ti.
            </p>
          </motion.div>
          <motion.div className="grid md:grid-cols-2 gap-6" initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.div
              variants={staggerItem}
              className="rounded-xl overflow-hidden"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px rgba(0,0,0,0.5), 0 0 50px rgba(139,60,247,0.06)' }}
            >
              <MacWindow url="open.spotify.com/pipesantos">
                <iframe
                  src="https://open.spotify.com/embed/episode/1IgzCLGtd5GT5VAJKWuk38?utm_source=generator"
                  width="100%" height="352" frameBorder={0}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="block"
                />
              </MacWindow>
            </motion.div>
            <motion.div
              variants={staggerItem}
              className="rounded-xl overflow-hidden"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px rgba(0,0,0,0.5), 0 0 50px rgba(139,60,247,0.06)' }}
            >
              <MacWindow url="open.spotify.com/pipesantos">
                <iframe
                  src="https://open.spotify.com/embed/episode/3xAd9gVStVB9YaPdaJ4oJh?utm_source=generator"
                  width="100%" height="352" frameBorder={0}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="block"
                />
              </MacWindow>
            </motion.div>
          </motion.div>
          <div className="text-center mt-10">
            <a href="https://open.spotify.com/show/2MaZs9kPXMWv20RysXRcxG" target="_blank" rel="noopener noreferrer" className="btn-ghost inline-block">Ver todos los episodios en Spotify</a>
          </div>
        </div>
      </section>

      {/* ── MARCAS CON LAS QUE TRABAJO ───────────── */}
      <BrandsSection />

      {/* ── TESTIMONIOS ──────────────────────────── */}
      <section id="testimonios" data-track-section="testimonios" className="relative z-10 px-6 md:px-12 py-20 overflow-hidden">
        <ScreenAmbientBg />
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionDivider className="mb-16" />
          <div className="text-center mb-16">
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Testimonios</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
              Clientes que <span className="italic" style={{ color: 'rgba(139,60,247,0.9)', position: 'relative', display: 'inline-block', padding: '0 5px', lineHeight: '1.1' }}><span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '4px', bottom: '-4px', background: 'rgba(255,255,255,0.65)', borderRadius: '3px', zIndex: -1 }} />confiaron</span> en nosotros
            </h2>
            <p className="font-body text-white/40 max-w-lg mx-auto">
              Descubre cómo he ayudado a muchos de mis clientes a través de la comunicación.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-7 max-w-4xl mx-auto">
            {testimonials.map((t, idx) => (
              <ScrollScale key={t.name} className="testimonial-card-pro" style={{ ['--card-delay' as string]: `${idx * -3}s` } as React.CSSProperties}>
                {/* Borde con gradiente conic animado */}
                <div className="tc-border" aria-hidden />
                {/* Comilla decorativa gigante de fondo */}
                <div className="tc-quote-mark" aria-hidden>"</div>
                {/* Highlight superior (efecto reflejo glass) */}
                <div className="tc-top-shine" aria-hidden />
                {/* Glow ambiente que pulsa */}
                <div className="tc-ambient-glow" aria-hidden />

                {/* Contenido */}
                <div className="tc-content">
                  <div className="flex gap-1 mb-5 tc-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: '#E07820', textShadow: '0 0 10px rgba(196,82,0,0.6)' }}>★</span>
                    ))}
                  </div>
                  <p className="font-body text-white/75 text-lg leading-relaxed mb-7 italic relative z-10">"{t.quote}"</p>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="tc-avatar-ring">
                      <img src={t.photo} alt={t.name} className="w-full h-full object-cover object-top rounded-full" />
                    </div>
                    <div>
                      <p className="font-body text-white font-medium text-sm">{t.name}</p>
                      <p className="font-mono text-xs text-white/40 leading-relaxed">{t.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollScale>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTO ───────────────────────────────── */}
      <section id="evento" data-track-section="evento" className="relative z-10 px-6 md:px-12 pt-10 pb-20 overflow-hidden">
        <ScreenAmbientBg accent="orange" />
        {/* Scrim oscuro detrás de la columna de texto — da contraste cinematográfico */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 15% 45%, rgba(7,5,8,0.72) 0%, transparent 70%)',
        }} />
        {/* Personaje Barranquilla — absolute relativo a la sección (full-width),
            NO al inner max-w-5xl para que quede al ras del borde derecho */}
        <div className="md:hidden absolute right-0 top-24 z-20" style={{ transform: 'translateX(5%)' }}>
          <EventoCharacter />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionDivider className="mb-14" />

          {/* Hero: card estilo Spotify Events */}
          <motion.div className="mb-16 flex justify-center" initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
            <div className="w-full max-w-sm md:max-w-md rounded-3xl overflow-hidden" style={{
              background: 'linear-gradient(180deg, #1e1826 0%, #100d18 100%)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.07)',
            }}>

              {/* Foto superior */}
              <div className="relative h-56 md:h-72">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/pipe-evento-card.png" alt="Pipe Santos en escenario" className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(14,10,20,0.95) 0%, rgba(14,10,20,0.35) 45%, transparent 70%)' }} />
                <div className="absolute bottom-4 left-5">
                  <p className="font-display text-3xl font-bold text-white" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}>Pipe Santos</p>
                </div>
              </div>

              {/* Panel info */}
              <div className="px-5 pt-4 pb-5">

                {/* Header */}
                <div className="flex justify-between items-center mb-1">
                  <p className="font-mono text-sm font-semibold text-white tracking-wide">Próximo evento</p>
                  <button onClick={() => setShowFlyer(true)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform duration-100 cursor-pointer" style={{ background: 'linear-gradient(135deg,#C45200,#E07820)', boxShadow: '0 0 16px rgba(196,82,0,0.5)', border: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
                <div className="h-0.5 w-20 rounded-full mb-4" style={{ background: 'linear-gradient(90deg,#C45200,#FF9A3C)' }} />

                {/* Fila evento */}
                <div className="flex gap-4 items-center py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="text-center min-w-[42px] flex-shrink-0">
                    <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'rgba(196,82,0,0.9)' }}>AGO</p>
                    <p className="font-display text-4xl font-bold text-white leading-none">22</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-white text-sm font-medium">La vida es cule viaje</p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Barranquilla · 2:00 – 6:00 PM</p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Solo {EVENT_MAX - eventSold} entradas disponibles</p>
                  </div>
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-center gap-1 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {[{ v: countdown.days, l: 'días' }, { v: countdown.hours, l: 'hrs' }, { v: countdown.minutes, l: 'min' }, { v: countdown.seconds, l: 'seg' }].map((item, i) => (
                    <div key={item.l} className="flex items-center gap-1">
                      {i > 0 && <span className="font-display text-white/20 text-lg mb-3">:</span>}
                      <div className="text-center">
                        <p className="font-display text-xl font-light text-white leading-none">{String(item.v).padStart(2,'0')}</p>
                        <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{item.l}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                {EVENT_MAX - eventSold <= 0 ? (
                  <p className="text-center font-mono text-xs text-white/40 tracking-widest uppercase mt-4">Agotadas</p>
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    <a href={EVENT_IG} target="_blank" rel="noopener noreferrer"
                      onClick={() => track({ type: 'click', target: 'open_event' })}
                      className="w-full py-3.5 text-center rounded-full font-mono text-sm tracking-widest uppercase text-white transition-all"
                      style={{ background: 'transparent', border: '1.5px solid rgba(196,82,0,0.85)', boxShadow: '0 0 18px rgba(196,82,0,0.4), inset 0 0 12px rgba(196,82,0,0.05)' }}>
                      Atento al lanzamiento
                    </a>
                    <button disabled
                      className="w-full py-3 text-center rounded-full font-mono text-xs tracking-widest uppercase cursor-not-allowed"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}>
                      Comprar entrada · $40.000
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Flyer — póster físico inclinado */}
          <motion.div className="mb-16 flex justify-center"
            initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
            <div className="relative" style={{ maxWidth: '300px', width: '100%' }}>
              {/* Glow naranja ambiental */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse, rgba(196,82,0,0.4) 0%, transparent 65%)',
                transform: 'scale(1.35)',
                filter: 'blur(24px)',
              }} />
              {/* Cinta adhesiva */}
              <div className="absolute z-10 w-14 h-5 rounded-sm" style={{
                top: '-10px', left: '50%',
                transform: 'translateX(-50%) rotate(-1.5deg)',
                background: 'rgba(255,225,160,0.72)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              }} />
              {/* Póster con rotación */}
              <motion.button
                onClick={() => setShowFlyer(true)}
                whileTap={{ scale: 0.97, rotate: 1 }}
                className="relative block w-full rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  transform: 'rotate(2.5deg)',
                  boxShadow: '-8px 16px 50px rgba(0,0,0,0.75), 0 0 35px rgba(196,82,0,0.18)',
                  border: 'none', background: 'none',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/evento-flyer-v2.jpg" alt="Flyer — La vida es cule viaje" className="w-full h-auto block" />
                <div className="absolute inset-0 flex items-end justify-end p-3" style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 45%)',
                }}>
                  <span className="font-mono text-[10px] text-white/55 tracking-widest uppercase">toca para ampliar</span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* ¿De qué se trata? */}
          <motion.div className="grid md:grid-cols-2 gap-12 items-center mb-16"
            initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            <motion.div variants={staggerItem}>
              <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ ¿De qué se trata?</p>
              <h3 className="font-display text-3xl md:text-4xl font-light text-white leading-tight mb-5">
                Una tarde que<br />
                <span className="italic" style={{ color: 'rgba(139,60,247,0.85)' }}>no olvidarás</span>
              </h3>
              <p className="font-body text-white/50 leading-relaxed mb-4">
                Cuatro horas en las que Pipe Santos te llevará a través de las historias que cambiaron su vida, con un mensaje que transformará la tuya.
              </p>
              <p className="font-body text-white/50 leading-relaxed">
                Risas, reflexiones y una energía colectiva que solo se vive en vivo.
              </p>
            </motion.div>
            <motion.div variants={staggerItem} className="glass rounded-3xl p-8 space-y-5"
              style={{ border: '1px solid rgba(139,60,247,0.15)' }}>
              {[
                { icon: '🎭', title: 'Conferencia en vivo', desc: 'Pipe Santos en escenario durante 4 horas' },
                { icon: '📸', title: 'Espacio de fotos', desc: 'Lleva el recuerdo a casa' },
                { icon: '✍️', title: 'Firma de libros', desc: 'Trae tu libro o compra uno en el lugar' },
                { icon: '🤝', title: 'Networking', desc: 'Conoce a la comunidad en persona' },
              ].map(item => (
                <div key={item.title} className="flex gap-4 items-start">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-body text-white/80 font-medium">{item.title}</p>
                    <p className="font-body text-white/40 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* CTA de entradas */}
          <motion.div className="max-w-2xl mx-auto" initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
            <div className="glass rounded-3xl p-8 mb-8" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="font-body text-white/80 font-medium">Entrada General</p>
                  <p className="font-mono text-xs text-white/30 mt-1">Acceso completo al evento</p>
                </div>
                <p className="font-display text-3xl font-light" style={{ color: '#8B3CF7' }}>$40.000</p>
              </div>
              <div className="mb-6">
                <div className="flex justify-between font-mono text-xs text-white/30 mb-2">
                  <span>{eventSold} vendidas</span>
                  <span>{EVENT_MAX - eventSold} disponibles</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-1 rounded-full transition-all duration-700"
                    style={{ width: `${(eventSold / EVENT_MAX) * 100}%`, background: 'linear-gradient(90deg,#8B3CF7,#C45200)' }} />
                </div>
              </div>
              {EVENT_MAX - eventSold <= 0 ? (
                <div className="rounded-xl py-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="font-mono text-sm text-white/40 tracking-widest uppercase">Agotado</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <a href={EVENT_IG} target="_blank" rel="noopener noreferrer"
                    className="btn-primary w-full py-5 text-center block"
                    style={{ background: 'linear-gradient(135deg, #C45200, #E07820, #FF9A3C)', boxShadow: '0 4px 24px rgba(196,82,0,0.45)' }}>
                    <span>Atento al lanzamiento</span>
                  </a>
                  <button disabled className="btn-primary w-full py-5 opacity-30 cursor-not-allowed">
                    <span>Comprar ahora — $40.000 COP</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-6">
              {/* Badge 1: Bold seguro */}
              <div className="trust-badge">
                <span className="trust-badge-shield" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d4d2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V6.5a1 1 0 0 0-.6-.92l-7-3a1 1 0 0 0-.8 0l-7 3A1 1 0 0 0 4 6.5V12c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </span>
                <span className="trust-badge-text">
                  <span className="trust-badge-label">Pago 100% seguro con</span>
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bold-logo.png" alt="Bold" className="trust-badge-bold-logo" />
              </div>

              {/* Badge 2: QR de ingreso */}
              <div className="trust-badge">
                <span className="trust-badge-bolt" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#8B3CF7" stroke="#8B3CF7" strokeWidth="1.5" strokeLinejoin="round">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </span>
                <span className="trust-badge-text">
                  <span className="trust-badge-label">QR de ingreso al evento directo a tu email</span>
                </span>
              </div>
            </div>
          </motion.div>

          <SectionDivider className="mt-14" />
        </div>
      </section>

      {/* ── CONTACTO ─────────────────────────────── */}
      <section id="contacto" data-track-section="contacto" className="relative z-10 px-6 md:px-12 py-20 overflow-hidden">
        <ScreenAmbientBg />
        <motion.div className="relative z-10 max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Contacto</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
            Quiero <span className="italic" style={{ color: 'rgba(139,60,247,0.8)' }}>leerte</span>
          </h2>
          <p className="font-body text-white/40 mb-12">Cuéntame de tu proyecto y trabajemos juntos.</p>
          <div className="glass rounded-2xl p-6 md:p-8 text-left space-y-5">
            <div>
              <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-2">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/20 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/20 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-2">Mensaje</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/20 outline-none transition-all resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="Descríbeme aquí tu proyecto..."
              />
            </div>
            <button
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleContact}
              disabled={contactStatus === 'loading' || contactStatus === 'ok'}
            >
              <span>
                {contactStatus === 'loading' ? 'Enviando…' : contactStatus === 'ok' ? '¡Mensaje enviado! ✓' : 'Enviar mensaje'}
              </span>
            </button>
            {contactStatus === 'error' && (
              <p className="font-mono text-xs text-red-400 text-center mt-2">{contactError}</p>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="relative z-10 border-t px-6 md:px-12 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/logo.png" alt="Pipe Santos" width={100} height={38} className="opacity-30" />
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              { label: 'Instagram', url: 'https://instagram.com/pipesantos93' },
              { label: 'TikTok', url: 'https://tiktok.com/@pipesantos93' },
              { label: 'Facebook', url: 'https://www.facebook.com/untalpipesantos' },
              { label: 'Spotify', url: 'https://open.spotify.com/show/2MaZs9kPXMWv20RysXRcxG' },
            ].map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs tracking-widest uppercase text-white/20 hover:text-white/60 transition-colors">
                {s.label}
              </a>
            ))}
          </div>
          <p className="font-mono text-xs text-white/15">© 2026 Pipe Santos. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Sticky CTA mobile — acceso permanente al botón de compra */}
      <StickyMobileCTA urgencyShort={urgency.short} level={urgency.level} />

    </main>
  )
}
