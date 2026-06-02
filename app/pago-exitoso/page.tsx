'use client'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Particles from '@/components/Particles'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* Pequeñas chispas que salen del punto de choque de las manos.
 * Posiciones precomputadas para que sea determinista (no rehidrata distinto). */
const SPARKLES = [
  { x: -54, y: -28, delay: 0.25, size: 7, color: '#94ccd4' },
  { x:  48, y: -34, delay: 0.30, size: 8, color: '#8B3CF7' },
  { x: -42, y:  44, delay: 0.35, size: 6, color: '#FFC832' },
  { x:  56, y:  38, delay: 0.28, size: 7, color: '#94ccd4' },
  { x: -68, y:   8, delay: 0.40, size: 5, color: '#8B3CF7' },
  { x:  72, y:   4, delay: 0.32, size: 6, color: '#FFC832' },
  { x: -22, y: -58, delay: 0.42, size: 5, color: '#94ccd4' },
  { x:  18, y:  62, delay: 0.38, size: 5, color: '#8B3CF7' },
]

function HighFiveCelebration() {
  return (
    <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto mb-2" aria-hidden>
      {/* Halo radial detrás del choque — pulsa al inicio */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,60,247,0.35) 0%, rgba(148,204,212,0.18) 35%, transparent 70%)', filter: 'blur(20px)' }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.15, 1], opacity: [0, 0.9, 0.55] }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      />

      {/* Animación MP4: 97KB (vs 930KB del GIF original = -89%).
          autoPlay + muted + playsInline → autoplay funciona en iOS Safari.
          Sin rotate/shake propio porque el video ya trae su movimiento. */}
      <motion.div
        className="relative w-full h-full"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.06, 1], opacity: [0, 1, 1] }}
        transition={{
          duration: 0.7,
          times: [0, 0.6, 1],
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="¡Choca esos cinco!"
          className="w-full h-full object-contain"
          style={{ pointerEvents: 'none', background: 'transparent' }}
        >
          {/* WebM con VP9 + alpha real (Chrome, Firefox, Safari 16+). */}
          <source src="/high-five.webm" type="video/webm" />
          {/* Fallback MP4 con bg #070508 baked-in (matchea el bg de la página
              → visualmente parece transparente en navegadores viejos). */}
          <source src="/high-five.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Chispas emanando del centro */}
      {SPARKLES.map((s, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
          style={{
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 ${s.size * 1.5}px ${s.color}`,
            x: -s.size / 2,
            y: -s.size / 2,
          }}
          initial={{ opacity: 0, scale: 0, x: -s.size / 2, y: -s.size / 2 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.4, 1, 0.4],
            x: [-s.size / 2, -s.size / 2 + s.x],
            y: [-s.size / 2, -s.size / 2 + s.y],
          }}
          transition={{ duration: 0.95, delay: s.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}

function Content() {
  const params = useSearchParams()
  const rawOrder = params.get('order')
  // Validar formato UUID antes de usar en href para prevenir open-redirect y URLs malformadas
  const order = rawOrder && UUID_RE.test(rawOrder) ? rawOrder : null

  return (
    <main className="grain min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#070508' }}>
      <Particles />
      <div className="relative z-10 max-w-md w-full text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative glass rounded-3xl p-10" style={{ border: '1px solid rgba(139,60,247,0.25)' }}>
          {/* Celebración: high-five chibi con chispas */}
          <HighFiveCelebration />

          <h1 className="font-display text-3xl text-white mb-3">¡Pago confirmado!</h1>
          <p className="font-body text-white/50 mb-8 leading-relaxed">
            En unos minutos recibirás tu entrada con el código QR en tu correo electrónico.
          </p>

          <div className="glass rounded-2xl p-5 mb-8 text-left space-y-3"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { icon: '📧', text: 'Revisa tu bandeja de entrada (y la carpeta de spam)' },
              { icon: '🙌', text: 'Te esperamos este 22 de agosto con la mejor energía' },
              { icon: '🎫', text: 'El QR es tu entrada — guárdalo bien' },
            ].map(item => (
              <div key={item.text} className="flex gap-3 items-start">
                <span className="text-lg">{item.icon}</span>
                <p className="font-body text-white/50 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {order && (
            <a href={`/lavida/ticket/${order}-1`}
              className="btn-primary w-full inline-block text-center mb-4">
              <span>Ver mi entrada →</span>
            </a>
          )}

          <a href="/evento" className="font-mono text-xs text-white/25 hover:text-white/50 transition-colors tracking-widest uppercase">
            ← Volver al evento
          </a>
        </div>

        <Image src="/logo.png" alt="Pipe Santos" width={90} height={34} className="opacity-20 mx-auto mt-8" />
      </div>
    </main>
  )
}

export default function PagoExitosoPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  )
}
