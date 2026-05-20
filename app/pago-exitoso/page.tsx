'use client'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Particles from '@/components/Particles'

function Content() {
  const params = useSearchParams()
  const order = params.get('order')

  return (
    <main className="grain min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#070508' }}>
      <Particles />
      <div className="relative z-10 max-w-md w-full text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative glass rounded-3xl p-10" style={{ border: '1px solid rgba(139,60,247,0.25)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(139,60,247,0.15)', border: '1px solid rgba(139,60,247,0.3)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8B3CF7" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>

          <h1 className="font-display text-3xl text-white mb-3">¡Pago confirmado!</h1>
          <p className="font-body text-white/50 mb-8 leading-relaxed">
            En unos minutos recibirás tu entrada con el código QR en tu correo electrónico.
          </p>

          <div className="glass rounded-2xl p-5 mb-8 text-left space-y-3"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { icon: '📧', text: 'Revisa tu bandeja de entrada (y la carpeta de spam)' },
              { icon: '📱', text: 'Si pusiste tu WhatsApp, también te llegará ahí' },
              { icon: '🎫', text: 'El QR es tu entrada — guárdalo bien' },
            ].map(item => (
              <div key={item.text} className="flex gap-3 items-start">
                <span className="text-lg">{item.icon}</span>
                <p className="font-body text-white/50 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {order && (
            <a href={`/lavida/ticket/${order}`}
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
