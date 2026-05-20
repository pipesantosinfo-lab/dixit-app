'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Particles from '@/components/Particles'

const EVENT_DATE = new Date('2026-08-22T14:00:00-05:00')
const MAX_TICKETS = 300

function useCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const update = () => {
      const diff = EVENT_DATE.getTime() - Date.now()
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function CheckoutModal({ onClose, sold }: { onClose: () => void; sold: number }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const available = MAX_TICKETS - sold

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Tu nombre y correo son obligatorios.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Por favor ingresa un correo válido.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: form.name,
          buyerEmail: form.email,
          buyerPhone: form.phone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error inesperado')
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(7,5,8,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 animate-fade-up"
        style={{
          background: 'linear-gradient(145deg, #0d0a14, #140e20)',
          border: '1px solid rgba(139,60,247,0.3)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(139,60,247,0.08)',
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-1">Entrada General</p>
            <h2 className="font-display text-2xl text-white">La vida es cule viaje</h2>
            <p className="font-display text-xl mt-1" style={{ color: '#8B3CF7' }}>$40.000 COP</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-3xl leading-none mt-1">×</button>
        </div>

        <div className="line-holo mb-6" />

        {available <= 20 && (
          <div className="mb-4 rounded-xl px-4 py-2 text-center"
            style={{ background: 'rgba(196,82,0,0.1)', border: '1px solid rgba(196,82,0,0.25)' }}>
            <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'rgba(196,82,0,0.9)' }}>
              ⚡ Solo quedan {available} entradas
            </p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {[
            { key: 'name', label: 'Nombre completo *', type: 'text', placeholder: 'Tu nombre' },
            { key: 'email', label: 'Correo electrónico *', type: 'email', placeholder: 'tu@correo.com' },
            { key: 'phone', label: 'WhatsApp (opcional — recibe tu QR aquí)', type: 'tel', placeholder: '+57 300 000 0000' },
          ].map(f => (
            <div key={f.key}>
              <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-2">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/20 text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,60,247,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-4 font-body">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? 'Redirigiendo a pago seguro...' : 'Continuar al pago →'}</span>
        </button>

        <p className="font-mono text-xs text-white/20 text-center mt-4">
          Pago seguro con Bold · Tu QR llega al instante
        </p>
      </div>
    </div>
  )
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass rounded-lg md:rounded-2xl w-9 h-9 md:w-20 md:h-20 flex items-center justify-center mb-0.5 md:mb-2"
        style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
        <span className="font-display text-sm md:text-3xl font-light text-white"
          style={{ textShadow: '0 0 20px rgba(139,60,247,0.5)' }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="font-mono text-[7px] md:text-xs text-white/30 tracking-wide md:tracking-widest uppercase">{label}</span>
    </div>
  )
}

export default function EventoPage() {
  const countdown = useCountdown()
  const [showModal, setShowModal] = useState(false)
  const [sold, setSold] = useState(0)

  useEffect(() => {
    fetch('/api/ticket-count').then(r => r.json()).then(d => setSold(d.count || 0)).catch(() => {})
  }, [])

  const available = MAX_TICKETS - sold
  const isSoldOut = available <= 0

  return (
    <main className="grain min-h-screen" style={{ background: '#070508' }}>
      <Particles />

      {showModal && <CheckoutModal onClose={() => setShowModal(false)} sold={sold} />}

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex justify-center md:justify-between items-center px-4 md:px-12 py-1 md:py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(7,5,8,0.95), transparent)', backdropFilter: 'blur(10px)' }}>
        <Image src="/logo.png" alt="Pipe Santos" width={80} height={29} className="opacity-90 md:w-[120px] md:h-[44px]" />
        {!isSoldOut && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm hidden md:block">
            <span>Comprar entrada</span>
          </button>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative md:min-h-screen px-4 md:px-6 pt-28 md:pt-24 pb-12 md:pb-20 flex items-start md:items-center">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(139,60,247,0.12) 0%, transparent 55%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 70%, rgba(196,82,0,0.07) 0%, transparent 50%)' }} />

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-10 lg:gap-20 items-center">

          {/* Left: text + countdown + CTA */}
          <div>
            <p className="font-mono text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.5em] text-aurora/80 uppercase mb-2 md:mb-6 animate-fade-up">
              <span className="md:hidden">◆ Barranquilla · 2026</span>
              <span className="hidden md:inline">◆ Pipe Santos · Barranquilla · 2026</span>
            </p>
            <div className="mb-4 md:mb-8 animate-fade-up-delay-1">
              <h1 className="font-display text-3xl md:text-6xl lg:text-8xl font-light text-white leading-none">
                La vida es
              </h1>
              <p className="text-3xl md:text-6xl lg:text-8xl leading-none -mt-3 md:-mt-8"
                style={{ fontFamily: 'Amsterdam, cursive', color: 'rgba(139,60,247,0.95)' }}>
                cule viaje
              </p>
            </div>

            <div className="flex flex-col gap-1.5 md:gap-3 mb-4 md:mb-10 animate-fade-up-delay-3">
              {[
                { icon: '📅', text: '22 ago · 2026' },
                { icon: '🕑', text: '2:00 – 6:00 PM' },
                { icon: '📍', text: 'Barranquilla' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-xs md:text-base">{item.icon}</span>
                  <span className="font-body text-xs md:text-base text-white/60 leading-tight">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <div className="flex gap-1 md:gap-4 mb-4 md:mb-10 animate-fade-up-delay-4">
              <CountdownBox value={countdown.days} label="días" />
              <div className="font-display text-sm md:text-3xl text-white/20 self-center mb-3 md:mb-6">:</div>
              <CountdownBox value={countdown.hours} label="hrs" />
              <div className="font-display text-sm md:text-3xl text-white/20 self-center mb-3 md:mb-6">:</div>
              <CountdownBox value={countdown.minutes} label="min" />
              <div className="font-display text-sm md:text-3xl text-white/20 self-center mb-3 md:mb-6">:</div>
              <CountdownBox value={countdown.seconds} label="seg" />
            </div>

            {isSoldOut ? (
              <div className="glass rounded-xl px-4 py-2 inline-block">
                <p className="font-mono text-xs text-white/50 tracking-widest uppercase">Agotadas</p>
              </div>
            ) : (
              <div className="animate-fade-up-delay-4">
                <button onClick={() => setShowModal(true)} className="btn-primary w-full md:w-auto px-4 md:px-10 py-3 md:py-5">
                  <span className="flex flex-col md:inline items-center leading-tight gap-0.5">
                    <span className="text-[8px] md:hidden tracking-[0.18em]">Adquiere tu entrada</span>
                    <span className="text-sm md:hidden tracking-widest">$40.000</span>
                    <span className="hidden md:inline text-base">Adquiere tu entrada · $40.000</span>
                  </span>
                </button>
                <p className="font-mono text-[9px] md:text-xs text-white/30 tracking-widest mt-2 md:mt-4 uppercase">
                  {available} de {MAX_TICKETS} disponibles
                </p>
              </div>
            )}
          </div>

          {/* Right: event flyer */}
          <div className="flex justify-center md:justify-end animate-fade-up-delay-2 self-start md:self-auto pt-2 md:pt-0">
            <div className="relative">
              <div className="absolute -inset-2 md:-inset-6 rounded-2xl md:rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.25) 0%, transparent 70%)' }} />
              <Image
                src="/evento-hero.jpg"
                alt="La vida es cule viaje — Barranquilla 2026"
                width={480}
                height={640}
                className="relative rounded-xl md:rounded-2xl max-h-[65vh] md:max-h-[68vh] w-auto"
                style={{
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 8px 40px rgba(139,60,247,0.35))',
                }}
                priority
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── SOBRE EL EVENTO ── */}
      <section className="relative z-10 px-6 md:px-12 pt-6 pb-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="line-holo mb-8 md:mb-16" />
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-6">◆ ¿De qué se trata?</p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-white leading-tight mb-6">
                Una tarde que<br />
                <span className="italic" style={{ color: 'rgba(139,60,247,0.85)' }}>no olvidarás</span>
              </h2>
              <p className="font-body text-white/50 text-lg leading-relaxed mb-5">
                Cuatro horas en las que Pipe Santos te llevará a través de las historias que cambiaron su vida, con un mensaje que transformará la tuya.
              </p>
              <p className="font-body text-white/50 text-lg leading-relaxed">
                Risas, reflexiones y una energía colectiva que solo se vive en vivo. Si seguiste a Pipe en redes, este es el lugar donde sus historias cobran vida.
              </p>
            </div>
            <div className="glass rounded-3xl p-8 space-y-6" style={{ border: '1px solid rgba(139,60,247,0.15)' }}>
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
            </div>
          </div>
          <div className="line-holo mt-16" />
        </div>
      </section>

      {/* ── TICKET CTA ── */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">◆ Entradas</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
            Asegura tu <span className="italic" style={{ color: 'rgba(139,60,247,0.85)' }}>lugar</span>
          </h2>
          <p className="font-body text-white/40 mb-10">
            Solo {MAX_TICKETS} personas. El QR llega a tu correo y WhatsApp al instante.
          </p>

          <div className="glass rounded-3xl p-8 mb-8" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
            <div className="flex justify-between items-center mb-6">
              <div className="text-left">
                <p className="font-body text-white/80 font-medium">Entrada General</p>
                <p className="font-mono text-xs text-white/30 mt-1">Acceso completo al evento</p>
              </div>
              <p className="font-display text-3xl font-light" style={{ color: '#8B3CF7' }}>$40.000</p>
            </div>

            {/* Availability bar */}
            <div className="mb-6">
              <div className="flex justify-between font-mono text-xs text-white/30 mb-2">
                <span>{sold} vendidas</span>
                <span>{available} disponibles</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1 rounded-full transition-all duration-700"
                  style={{ width: `${(sold / MAX_TICKETS) * 100}%`, background: 'linear-gradient(90deg, #8B3CF7, #C45200)' }} />
              </div>
            </div>

            {isSoldOut ? (
              <div className="rounded-xl py-4 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-mono text-sm text-white/40 tracking-widest uppercase">Agotado</p>
              </div>
            ) : (
              <button onClick={() => setShowModal(true)} className="btn-primary w-full text-base py-5">
                <span>Comprar ahora — $40.000 COP</span>
              </button>
            )}
          </div>

          <div className="flex justify-center gap-8">
            {[
              { icon: '🔒', text: 'Pago 100% seguro con Bold' },
              { icon: '⚡', text: 'QR instantáneo por email' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="font-mono text-xs text-white/30">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t px-6 md:px-12 py-10 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Image src="/logo.png" alt="Pipe Santos" width={90} height={34} className="opacity-25 mx-auto mb-4" />
        <p className="font-mono text-xs text-white/15">© 2026 Pipe Santos · Todos los derechos reservados</p>
      </footer>
    </main>
  )
}
