'use client'
import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion'
import Particles from '@/components/Particles'
import WavingPipe from '@/components/WavingPipe'
import TransparentImg from '@/components/TransparentImg'
import IntroOverlay from '@/components/IntroOverlay'
import BorisCharacter from '@/components/BorisCharacter'
import EventoCharacter from '@/components/EventoCharacter'

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
        <div className="line-holo mb-6" />
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
const VP = { once: true, amount: 0.15 }

const galleryPhotos = [
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

const bookFeatures = [
  { title: 'Historias reales de inicio a fin', desc: 'Encontrarás información muy valiosa para muchos aspectos de tu vida, mientras disfrutas de un viaje en el tiempo por diferentes etapas de mi vida.' },
  { title: 'Proyectos, sueños y metas', desc: 'Descubrirás formas, tips y métodos para escalar hacia tus objetivos más importantes.' },
]

const pipeMessages = ['¡Hola! 👋', '¡Bienvenido!', '¿Ya tienes tu entrada? 🎟️', '¡Nos vemos en Barranquilla!', '¡Gracias por estar aquí! ✨']

export default function PreviewPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [pipeMsgIndex, setPipeMsgIndex] = useState(0)
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventSold, setEventSold] = useState(0)
  const countdown = useCountdown()
  useEffect(() => {
    fetch('/api/ticket-count').then(r => r.json()).then(d => setEventSold(d.count || 0)).catch(() => {})
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
  const socialRef = useRef<HTMLElement>(null)
  const socialInView = useInView(socialRef, { once: false, margin: '0px 0px -80px 0px' })
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const openLightbox = (i: number) => { setLightboxIndex(i); document.body.style.overflow = 'hidden' }
  const closeLightbox = useCallback(() => { setLightboxIndex(null); document.body.style.overflow = '' }, [])
  const prevPhoto = useCallback(() => setLightboxIndex(i => i === null ? null : (i - 1 + galleryPhotos.length) % galleryPhotos.length), [])
  const nextPhoto = useCallback(() => setLightboxIndex(i => i === null ? null : (i + 1) % galleryPhotos.length), [])

  return (
    <main className="grain min-h-screen overflow-x-hidden" style={{ background: '#070508' }}>
      <IntroOverlay />
      <Particles />

      {showEventModal && <EventoModal onClose={() => setShowEventModal(false)} sold={eventSold} />}

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
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center md:justify-between items-center px-4 md:px-12 py-1 md:py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(7,5,8,0.95), transparent)', backdropFilter: 'blur(10px)' }}>
        <Image src="/logo.png" alt="Pipe Santos" width={110} height={40} className="opacity-90" />
        <div className="hidden md:flex gap-8">
          {[['#sobre', 'Sobre mí'], ['#galeria', 'Galería'], ['#libro', 'Libro'], ['#podcast', 'Podcast'], ['#testimonios', 'Testimonios'], ['#contacto', 'Contacto']].map(([href, label]) => (
            <a key={label} href={href} className="font-mono text-xs tracking-widest text-white/40 hover:text-white uppercase transition-colors">{label}</a>
          ))}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-start overflow-hidden">
        {/* Background photo con parallax */}
        <div className="absolute inset-0">
          <motion.div className="absolute inset-0 bg-cover bg-center bg-top" style={{ backgroundImage: "url('/hero.jpg')", y: heroY, scale: 1.15 }} />
          {/* Gradiente diagonal: oscuro arriba-izquierda donde está el texto, transparente abajo */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(155deg, rgba(7,5,8,0.97) 0%, rgba(7,5,8,0.9) 20%, rgba(7,5,8,0.4) 40%, transparent 58%)' }} />
          {/* Oscuridad mínima en la parte inferior para transición suave */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,5,8,0.6) 0%, transparent 20%)' }} />
          {/* Sombra desde arriba para cubrir el área del título y subtítulo */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,5,8,0.92) 0%, rgba(7,5,8,0.82) 30%, rgba(7,5,8,0.5) 55%, rgba(7,5,8,0.1) 75%, transparent 90%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 35%, rgba(139,60,247,0.1) 0%, transparent 50%)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pb-16" style={{ paddingTop: '20vh' }}>
          {/* Texto */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p variants={fadeUp} className="font-mono text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] text-aurora/80 uppercase mb-5">
              ◆ Conferencista · Escritor · Influencer
            </motion.p>
            <motion.h1 variants={fadeUp} data-text={HERO_WORDS[heroWordIdx]} className="glitch-crt font-display text-5xl md:text-[7rem] font-light text-white leading-none mb-0">
              {heroWordIdx === 0 && !heroWordCycled.current
                ? <ScrambleText text="Conectando" delay={2800} />
                : <span style={{ position: 'relative', zIndex: 1, color: 'white' }}>{HERO_WORDS[heroWordIdx]}</span>}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[2.3rem] md:text-6xl mb-8 whitespace-nowrap" style={{ fontFamily: 'Amsterdam, cursive', color: 'rgba(139,60,247,0.9)', textShadow: '0 2px 20px rgba(7,5,8,0.9)' }}>
              A partir de historias
            </motion.p>
            {/* Botón Barranquilla 2026 oculto temporalmente */}
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
      </section>

      {/* ── ESTADÍSTICAS ─────────────────────────── */}
      <section ref={socialRef} className="relative z-10 px-6 md:px-12 py-20">
        <HeartParticles active={socialInView} />
        <div className="max-w-5xl mx-auto">
          <motion.div className="flex justify-start mb-14" style={{ marginLeft: '-12%' }} initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
            <Image
              src="/comunidad-logo.png"
              alt="Conoce mi comunidad"
              width={420}
              height={160}
              className="w-full max-w-sm md:max-w-lg h-auto"
            />
          </motion.div>
          <motion.div className="grid md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>

            {/* TikTok */}
            <motion.div variants={staggerItem} className="glass rounded-2xl p-6 md:p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                </svg>
              </div>
              <p className="font-mono text-xs tracking-widest text-white/30 uppercase mb-2">TikTok</p>
              <p className="font-display text-4xl font-light text-white mb-1"><SocialCount target={234} /></p>
              <p className="font-mono text-xs text-white/30 tracking-wider">seguidores</p>
              <p className="font-body text-white/40 text-sm leading-relaxed mt-5 text-left">
                Los números hablan por sí mismos: publicaciones virales, un alto nivel de interacción y una comunidad que no deja de expandirse.
              </p>
              <p className="font-body text-white/50 text-sm leading-relaxed mt-3 text-left">
                💥 Mi comunidad es grande, sólida y altamente comprometida. Su apoyo es la razón principal detrás de este crecimiento orgánico.
              </p>
              <a href="https://tiktok.com/@pipesantos93" target="_blank" rel="noopener noreferrer"
                className="mt-5 font-mono text-xs tracking-widest uppercase transition-colors"
                style={{ color: 'rgba(139,60,247,0.6)' }}>
                @pipesantos93 →
              </a>
            </motion.div>

            {/* Instagram */}
            <motion.div variants={staggerItem} className="glass rounded-2xl p-6 md:p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all relative" style={{ overflow: 'visible' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <p className="font-mono text-xs tracking-widest text-white/30 uppercase mb-2">Instagram</p>
              <p className="font-display text-4xl font-light text-white mb-1"><SocialCount target={164} /></p>
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
                className="mt-5 font-mono text-xs tracking-widest uppercase transition-colors"
                style={{ color: 'rgba(139,60,247,0.6)' }}>
                @pipesantos93 →
              </a>
            </motion.div>

            {/* Facebook */}
            <motion.div variants={staggerItem} className="glass rounded-2xl p-6 md:p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <p className="font-mono text-xs tracking-widest text-white/30 uppercase mb-2">Facebook</p>
              <p className="font-display text-4xl font-light text-white mb-1"><SocialCount target={520} /></p>
              <p className="font-mono text-xs text-white/30 tracking-wider">seguidores</p>
              <p className="font-body text-white/40 text-sm leading-relaxed mt-5 text-left">
                La narrativa es el lenguaje universal que rompe fronteras. En Facebook, las historias de Pipe Santos conectan con personas de distintas culturas, países y realidades.
              </p>
              <p className="font-body text-white/50 text-sm leading-relaxed mt-3 text-left">
                🌎 Una comunidad internacional unida por algo poderoso: la fuerza de una historia bien contada.
              </p>
              <a href="https://facebook.com/pipesantos" target="_blank" rel="noopener noreferrer"
                className="mt-5 font-mono text-xs tracking-widest uppercase transition-colors"
                style={{ color: 'rgba(139,60,247,0.6)' }}>
                Pipe Santos →
              </a>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ── SHOWREEL ─────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Showreel</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-3">
              Mira lo que pasa en <span className="italic" style={{ color: 'rgba(139,60,247,0.85)' }}>mis eventos</span>
            </h2>
            <p className="font-body text-white/40 max-w-md mx-auto">
              Una experiencia única que transforma audiencias y deja huella.
            </p>
          </motion.div>

          <motion.div className="relative rounded-2xl overflow-hidden" initial="hidden" whileInView="visible" viewport={VP} variants={fadeIn}
            style={{ boxShadow: '0 0 0 1px rgba(139,60,247,0.15), 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,60,247,0.08)' }}>
            <div className="absolute -inset-1 rounded-2xl" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(139,60,247,0.12) 0%, transparent 70%)', zIndex: -1 }} />
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full block"
              style={{ maxHeight: '600px', background: '#070508' }}
            >
              <source src="/showreel.mp4" type="video/mp4" />
            </video>
          </motion.div>
        </div>
      </section>

      {/* ── SOBRE MÍ ─────────────────────────────── */}
      <section id="sobre" className="relative z-10 px-6 md:px-12 py-20 overflow-hidden">
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
            <motion.div className="relative" initial="hidden" whileInView="visible" viewport={VP} variants={slideRight}>
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.15) 0%, transparent 70%)', transform: 'scale(1.2)' }} />
              <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <div className="w-full h-full bg-cover bg-center bg-top" style={{ backgroundImage: "url('/gallery/DSC01807.jpg')" }} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pt-20 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="line-holo mb-14" />
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
      <section id="galeria" className="relative z-10 px-6 md:px-12 pt-4 pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="line-holo mb-14" />
          <div className="text-center mb-14">
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Eventos</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-3">
              Momentos que <span className="italic" style={{ color: 'rgba(139,60,247,0.85)' }}>inspiran</span>
            </h2>
            <p className="font-body text-white/40 max-w-md mx-auto">
              Cada evento es una historia única. Aquí algunos de esos momentos especiales.
            </p>
          </div>

          {/* Masonry grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {galleryPhotos.map((src, i) => (
              <motion.div
                key={src}
                className="break-inside-avoid relative overflow-hidden rounded-xl cursor-pointer group"
                style={{ marginBottom: '12px' }}
                onClick={() => openLightbox(i)}
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
      <section id="libro" className="relative z-10 px-6 md:px-12 pt-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="line-holo mb-14" />
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
              <a href="#" className="btn-primary inline-block" style={{ background: 'linear-gradient(135deg, #C45200, #E07820)' }}>
                <span>Comprar ahora</span>
              </a>
            </motion.div>
            <motion.div className="order-1 md:order-2 flex justify-center" initial="hidden" whileInView="visible" viewport={VP} variants={slideRight}>
              <div className="relative">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse, rgba(196,82,0,0.25) 0%, transparent 65%)', transform: 'scale(1.4)' }} />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: '280px', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(196,82,0,0.15)' }}>
                  <Image src="/book-cover.png" alt="Lo que nunca le conté a papá" width={280} height={400} className="w-full h-auto" />
                </div>
              </div>
            </motion.div>
          </div>
          <div className="line-holo mt-16" />
        </div>
      </section>

      {/* ── PODCAST ──────────────────────────────── */}
      <section id="podcast" className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
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
            <motion.iframe variants={staggerItem}
              style={{ borderRadius: '12px' }}
              src="https://open.spotify.com/embed/episode/1IgzCLGtd5GT5VAJKWuk38?utm_source=generator"
              width="100%" height="352" frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
            <motion.iframe variants={staggerItem}
              style={{ borderRadius: '12px' }}
              src="https://open.spotify.com/embed/episode/3xAd9gVStVB9YaPdaJ4oJh?utm_source=generator"
              width="100%" height="352" frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </motion.div>
          <div className="text-center mt-10">
            <a href="https://open.spotify.com/show/2MaZs9kPXMWv20RysXRcxG" target="_blank" rel="noopener noreferrer" className="btn-ghost inline-block">Ver todos los episodios en Spotify</a>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ──────────────────────────── */}
      <section id="testimonios" className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="line-holo mb-16" />
          <div className="text-center mb-16">
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Testimonios</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
              Clientes que <span className="italic" style={{ color: 'rgba(139,60,247,0.8)' }}>confiaron</span> en nosotros
            </h2>
            <p className="font-body text-white/40 max-w-lg mx-auto">
              Descubre cómo he ayudado a muchos de mis clientes a través de la comunicación.
            </p>
          </div>
          <motion.div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto" initial="hidden" whileInView="visible" viewport={VP} variants={stagger}>
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={staggerItem} className="glass rounded-2xl p-6 md:p-8">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: '#C45200' }}>★</span>
                  ))}
                </div>
                <p className="font-body text-white/60 text-lg leading-relaxed mb-8 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(139,60,247,0.3)' }}>
                    <img src={t.photo} alt={t.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <p className="font-body text-white/80 font-medium text-sm">{t.name}</p>
                    <p className="font-mono text-xs text-white/30 leading-relaxed">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── EVENTO ───────────────────────────────── */}
      <section id="evento" className="relative z-10 px-6 md:px-12 pt-10 pb-20 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="line-holo mb-14" />

          {/* Hero: poster + título + countdown + CTA */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center mb-16">
            <motion.div initial="hidden" whileInView="visible" viewport={VP} variants={slideLeft}>
              <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-6">◆ Próximo evento</p>
              <h2 className="font-display text-5xl md:text-7xl font-light text-white leading-none">La vida es</h2>
              <p className="text-5xl md:text-7xl leading-none -mt-3 md:-mt-5"
                style={{ fontFamily: 'Amsterdam, cursive', color: 'rgba(139,60,247,0.95)' }}>
                cule viaje
              </p>
              <div className="flex flex-col gap-2 mt-7 mb-8">
                {[{ icon: '📅', text: '22 ago · 2026' }, { icon: '🕑', text: '2:00 – 6:00 PM' }, { icon: '📍', text: 'Barranquilla' }].map(item => (
                  <div key={item.text} className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="font-body text-base text-white/60">{item.text}</span>
                  </div>
                ))}
              </div>
              {/* Countdown */}
              <div className="flex gap-3 md:gap-4 mb-8">
                <CountdownBox value={countdown.days}    label="días" />
                <div className="font-display text-2xl text-white/20 self-center pb-5">:</div>
                <CountdownBox value={countdown.hours}   label="hrs"  />
                <div className="font-display text-2xl text-white/20 self-center pb-5">:</div>
                <CountdownBox value={countdown.minutes} label="min"  />
                <div className="font-display text-2xl text-white/20 self-center pb-5">:</div>
                <CountdownBox value={countdown.seconds} label="seg"  />
              </div>
              {/* CTAs */}
              {EVENT_MAX - eventSold <= 0 ? (
                <div className="glass rounded-xl px-4 py-2 inline-block">
                  <p className="font-mono text-xs text-white/50 tracking-widest uppercase">Agotadas</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={EVENT_IG} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    <span>Atento al lanzamiento</span>
                  </a>
                  <button disabled className="btn-ghost opacity-40 cursor-not-allowed">
                    Comprar entrada · $40.000
                  </button>
                </div>
              )}
            </motion.div>

            {/* Personaje Barranquilla — solo móvil, mismo estilo que WavingPipe */}
            <div className="md:hidden absolute right-0 top-24 z-20" style={{ transform: 'translateX(5%)' }}>
              <EventoCharacter />
            </div>

            {/* Poster */}
            <motion.div className="flex justify-center md:justify-end" initial="hidden" whileInView="visible" viewport={VP} variants={slideRight}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.2) 0%, transparent 70%)' }} />
                <Image
                  src="/evento-hero.jpg"
                  alt="La vida es cule viaje — Barranquilla 2026"
                  width={420} height={560}
                  className="relative rounded-2xl w-full max-w-xs md:max-w-sm"
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 40px rgba(139,60,247,0.3))' }}
                />
              </div>
            </motion.div>
          </div>

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
                    className="btn-primary w-full py-5 text-center block">
                    <span>Atento al lanzamiento</span>
                  </a>
                  <button disabled className="btn-primary w-full py-5 opacity-30 cursor-not-allowed">
                    <span>Comprar ahora — $40.000 COP</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-8">
              {[{ icon: '🔒', text: 'Pago 100% seguro con Bold' }, { icon: '⚡', text: 'QR instantáneo por email' }].map(item => (
                <div key={item.text} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="font-mono text-xs text-white/30">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="line-holo mt-14" />
        </div>
      </section>

      {/* ── CONTACTO ─────────────────────────────── */}
      <section id="contacto" className="relative z-10 px-6 md:px-12 py-20">
        <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={VP} variants={fadeUp}>
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Contacto</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
            Quiero <span className="italic" style={{ color: 'rgba(139,60,247,0.8)' }}>leerte</span>
          </h2>
          <p className="font-body text-white/40 mb-12">Cuéntame tu proyecto o en qué puedo ayudarte.</p>
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
            <button className="btn-primary w-full"><span>Enviar mensaje</span></button>
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
              { label: 'Facebook', url: 'https://facebook.com/pipesantos' },
              { label: 'Spotify', url: 'https://open.spotify.com/show/2MaZs9kPXMWv20RysXRcxG' },
            ].map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs tracking-widest uppercase text-white/20 hover:text-white/60 transition-colors">
                {s.label}
              </a>
            ))}
          </div>
          <p className="font-mono text-xs text-white/15">© 2025 Pipe Santos. Todos los derechos reservados.</p>
        </div>
      </footer>

    </main>
  )
}
