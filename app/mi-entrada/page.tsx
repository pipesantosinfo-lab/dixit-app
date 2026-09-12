'use client'
import { useState } from 'react'
import Image from 'next/image'
import { EVENTO } from '@/lib/evento'

/**
 * "Pagué y no me llegó nada": la persona escribe el correo con el que
 * compró y se le reenvían sus entradas. La respuesta es la misma exista o
 * no el correo (ver /api/reenviar-entrada).
 */
export default function MiEntradaPage() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'listo' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (estado === 'enviando') return
    setEstado('enviando')
    try {
      const r = await fetch('/api/reenviar-entrada', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await r.json()
      if (!r.ok) { setEstado('error'); setMensaje(d.error || 'No se pudo reenviar. Intenta de nuevo.'); return }
      setEstado('listo'); setMensaje(d.mensaje)
    } catch {
      setEstado('error'); setMensaje('Sin conexión. Intenta de nuevo.')
    }
  }

  return (
    <main className="grain min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#070508' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.14) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Pipe Santos" width={96} height={36} className="opacity-80" />
        </div>

        <div className="rounded-3xl p-7" style={{
          background: 'linear-gradient(145deg, #0d0a14, #140e20)',
          border: '1px solid rgba(139,60,247,0.25)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 50px rgba(139,60,247,0.08)',
        }}>
          <p className="font-mono text-[10px] tracking-[3px] uppercase mb-3" style={{ color: '#ff9a3c' }}>◆ Recuperar mi entrada</p>
          <h1 className="font-display text-2xl text-white mb-2" style={{ lineHeight: 1.15 }}>
            ¿Compraste y no te llegó el correo?
          </h1>
          <p className="font-body text-sm text-white/50 leading-relaxed mb-6">
            Escribe el correo con el que compraste tu entrada para <em style={{ color: '#C45CFF', fontStyle: 'normal' }}>{EVENTO.nombre}</em> y te la reenviamos ahora mismo.
          </p>

          {estado === 'listo' ? (
            <div className="rounded-2xl px-4 py-4 text-sm font-body leading-relaxed"
              style={{ background: 'rgba(139,60,247,0.12)', border: '1px solid rgba(139,60,247,0.3)', color: 'rgba(230,215,255,0.95)' }}>
              ✓ {mensaje}
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] tracking-[2px] uppercase text-white/40 mb-2">Correo electrónico</label>
                <input
                  type="email" required autoComplete="email" inputMode="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full rounded-xl px-4 py-3 font-body text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
              {estado === 'error' && (
                <p className="text-sm font-body" style={{ color: 'rgba(255,140,140,0.9)' }}>{mensaje}</p>
              )}
              <button type="submit" disabled={estado === 'enviando'} className="btn-primary w-full disabled:opacity-60">
                <span>{estado === 'enviando' ? 'Enviando…' : 'Reenviar mi entrada →'}</span>
              </button>
            </form>
          )}

          <p className="font-mono text-[10px] text-white/25 leading-relaxed mt-6">
            Si pagaste por PSE, el banco puede tardar unos minutos en confirmar. Si después de 15 minutos sigue sin llegar, escríbenos a
            {' '}<a href="mailto:pipesantosinfo@gmail.com" style={{ color: 'rgba(196,140,255,0.8)' }}>pipesantosinfo@gmail.com</a>.
          </p>
        </div>

        <a href="/#evento" className="block text-center font-mono text-xs text-white/25 hover:text-white/50 transition-colors tracking-widest uppercase mt-6">
          ← Volver al evento
        </a>
      </div>
    </main>
  )
}
