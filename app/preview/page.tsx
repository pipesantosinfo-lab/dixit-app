'use client'
import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import Particles from '@/components/Particles'

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
      { threshold: 0.5 }
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

export default function PreviewPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const openLightbox = (i: number) => { setLightboxIndex(i); document.body.style.overflow = 'hidden' }
  const closeLightbox = useCallback(() => { setLightboxIndex(null); document.body.style.overflow = '' }, [])
  const prevPhoto = useCallback(() => setLightboxIndex(i => i === null ? null : (i - 1 + galleryPhotos.length) % galleryPhotos.length), [])
  const nextPhoto = useCallback(() => setLightboxIndex(i => i === null ? null : (i + 1) % galleryPhotos.length), [])

  return (
    <main className="grain min-h-screen" style={{ background: '#070508' }}>
      <Particles />

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
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(7,5,8,0.95), transparent)', backdropFilter: 'blur(10px)' }}>
        <Image src="/logo.png" alt="Pipe Santos" width={130} height={48} className="opacity-90" />
        <div className="hidden md:flex gap-8">
          {[['#sobre', 'Sobre mí'], ['#galeria', 'Galería'], ['#libro', 'Libro'], ['#podcast', 'Podcast'], ['#testimonios', 'Testimonios'], ['#contacto', 'Contacto']].map(([href, label]) => (
            <a key={label} href={href} className="font-mono text-xs tracking-widest text-white/40 hover:text-white uppercase transition-colors">{label}</a>
          ))}
        </div>
        <a href="/event/dixit-vol1" className="btn-primary hidden md:block"><span>Comprar Entradas</span></a>
      </nav>

      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-end">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg')" }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,5,8,0.4) 0%, rgba(7,5,8,0.1) 20%, rgba(7,5,8,0.7) 65%, rgba(7,5,8,1) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 60%, rgba(139,60,247,0.12) 0%, transparent 55%)' }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pb-24 pt-40">
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/80 uppercase mb-5 animate-fade-up">
            ◆ Conferencista · Escritor · Influencer
          </p>
          <h1 className="font-display text-6xl md:text-[7rem] font-light text-white leading-none mb-3 animate-fade-up-delay-1">
            Conectando
          </h1>
          <p className="text-4xl md:text-6xl mb-8 animate-fade-up-delay-2" style={{ fontFamily: 'Amsterdam, cursive', color: 'rgba(139,60,247,0.9)' }}>
            A partir de historias
          </p>
          <p className="font-body text-lg md:text-xl text-white/50 max-w-lg leading-relaxed mb-10 animate-fade-up-delay-3">
            Descubre cómo, a través de historias reales, contribuyo al crecimiento{' '}
            <strong className="text-white/80 font-medium">personal y profesional</strong> de mi comunidad.
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-up-delay-4">
            <a href="#libro" className="btn-primary"><span>Conoce mi libro</span></a>
            <a href="#contacto" className="btn-ghost">Escríbeme</a>
          </div>
        </div>
      </section>

      {/* ── ESTADÍSTICAS ─────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
              Métricas
            </h2>
            <p className="text-3xl md:text-4xl mt-1" style={{ fontFamily: 'Amsterdam, cursive', color: 'rgba(139,60,247,0.9)' }}>
              que nos respaldan
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">

            {/* TikTok */}
            <div className="glass rounded-2xl p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all">
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
            </div>

            {/* Instagram */}
            <div className="glass rounded-2xl p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all">
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
              <a href="https://instagram.com/pipesantos93" target="_blank" rel="noopener noreferrer"
                className="mt-5 font-mono text-xs tracking-widest uppercase transition-colors"
                style={{ color: 'rgba(139,60,247,0.6)' }}>
                @pipesantos93 →
              </a>
            </div>

            {/* Facebook */}
            <div className="glass rounded-2xl p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all">
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
            </div>

          </div>
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
            <div>
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
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.15) 0%, transparent 70%)', transform: 'scale(1.2)' }} />
              <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <div className="w-full h-full bg-cover bg-center bg-top" style={{ backgroundImage: "url('/pipe-crowd.jpg')" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="line-holo mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {stats.map((s) => (
              <StatCard key={s.label} num={s.num} label={s.label} suffix={s.suffix} />
            ))}
          </div>
          <div className="line-holo mt-16" />
        </div>
      </section>

      {/* ── GALERÍA ──────────────────────────────── */}
      <section id="galeria" className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="line-holo mb-16" />
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
              <div
                key={src}
                className="break-inside-avoid relative overflow-hidden rounded-xl cursor-pointer group"
                style={{ marginBottom: '12px' }}
                onClick={() => openLightbox(i)}
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
              </div>
            ))}
          </div>
          <div className="line-holo mt-16" />
        </div>
      </section>

      {/* ── LIBRO ────────────────────────────────── */}
      <section id="libro" className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="line-holo mb-16" />
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
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
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse, rgba(196,82,0,0.25) 0%, transparent 65%)', transform: 'scale(1.4)' }} />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: '280px', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(196,82,0,0.15)' }}>
                  <Image src="/book-cover.png" alt="Lo que nunca le conté a papá" width={280} height={400} className="w-full h-auto" />
                </div>
              </div>
            </div>
          </div>
          <div className="line-holo mt-16" />
        </div>
      </section>

      {/* ── PODCAST ──────────────────────────────── */}
      <section id="podcast" className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Podcast</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
              Escucha mi <span className="italic" style={{ color: 'rgba(139,60,247,0.8)' }}>podcast</span>
            </h2>
            <p className="font-body text-white/40 text-lg max-w-lg mx-auto">
              Aquí podrás escuchar algunas <strong className="text-white/60">historias poderosas</strong> que con mucho cariño he producido para ti.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'La banca de aquel parque', date: '21 oct · Pipe Santos' },
              { title: 'La Ausencia de los perros', date: '20 oct · Pipe Santos' },
            ].map((ep) => (
              <div key={ep.title} className="glass rounded-2xl p-6 flex items-center gap-5 group hover:border-iris/30 transition-all">
                <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(139,60,247,0.15)', border: '1px solid rgba(139,60,247,0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="#1DB954" />
                    <path d="M16 12l-6 3.5v-7L16 12z" fill="white" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-white/80 font-medium truncate">{ep.title}</p>
                  <p className="font-mono text-xs text-white/30 mt-1">{ep.date}</p>
                </div>
                <a href="#" className="font-mono text-xs text-iris/60 hover:text-iris tracking-widest uppercase transition-colors">
                  Escuchar →
                </a>
              </div>
            ))}
          </div>
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
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-2xl p-8">
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
              </div>
            ))}
          </div>
          <div className="line-holo mt-16" />
        </div>
      </section>

      {/* ── CONTACTO ─────────────────────────────── */}
      <section id="contacto" className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Contacto</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
            Quiero <span className="italic" style={{ color: 'rgba(139,60,247,0.8)' }}>leerte</span>
          </h2>
          <p className="font-body text-white/40 mb-12">Cuéntame tu proyecto o en qué puedo ayudarte.</p>
          <div className="glass rounded-2xl p-8 text-left space-y-5">
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
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="relative z-10 border-t px-6 md:px-12 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/logo.png" alt="Pipe Santos" width={100} height={38} className="opacity-30" />
          <div className="flex gap-6">
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
