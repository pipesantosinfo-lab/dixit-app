'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Event, TicketTier } from '@/lib/types'
import Particles from '@/components/Particles'
import TierCard from '@/components/TierCard'
import CheckoutModal from '@/components/CheckoutModal'

interface Props {
  event: Event
  tiers: TicketTier[]
}

export default function EventClient({ event, tiers }: Props) {
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null)
  const totalSold = tiers.reduce((s, t) => s + t.sold_quantity, 0)
  const totalCapacity = tiers.reduce((s, t) => s + t.total_quantity, 0)
  const soldPct = Math.round((totalSold / totalCapacity) * 100)

  return (
    <main className="grain min-h-screen bg-void relative overflow-x-hidden">
      <Particles />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background image with deep overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/hero.jpg')" }} />
          {/* Multi-layer gradient overlay for depth */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(7,5,8,0.5) 0%, rgba(7,5,8,0.2) 30%, rgba(7,5,8,0.75) 70%, rgba(7,5,8,1) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(139,60,247,0.12) 0%, transparent 60%)',
          }} />
        </div>

        {/* Logo header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 pt-8">
          <Image src="/logo.png" alt="Pipe Santos" width={160} height={60} className="opacity-90" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end min-h-screen max-w-6xl mx-auto px-6 pb-20 pt-32">
          
          {/* Eyebrow */}
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4 animate-fade-up">
            ◆ Experiencia Inmersiva
          </p>

          {/* Event name */}
          <h1 className="font-display text-7xl md:text-[9rem] font-light leading-none tracking-tight text-white mb-4 animate-fade-up-delay-1">
            {event.name}
          </h1>

          {/* Tagline */}
          <p className="font-display text-xl md:text-3xl italic text-white/50 mb-10 animate-fade-up-delay-2 max-w-2xl">
            {event.tagline}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-6 mb-10 animate-fade-up-delay-3">
            <div className="flex items-center gap-2">
              <span className="text-iris text-lg">◈</span>
              <span className="font-body text-white/60 text-sm">{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-aurora text-lg">◈</span>
              <span className="font-body text-white/60 text-sm">{event.location}</span>
            </div>
            {event.doors_open && (
              <div className="flex items-center gap-2">
                <span className="text-blush text-lg">◈</span>
                <span className="font-body text-white/60 text-sm">{event.doors_open}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 animate-fade-up-delay-4">
            <button
              onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary"
            >
              <span>Comprar Entrada</span>
            </button>
            <button
              onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-ghost"
            >
              Leer la historia
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-30">
          <span className="font-mono text-xs tracking-widest text-white">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── Story section ────────────────────────────── */}
      <section id="story" className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        <div className="line-holo mb-16" />

        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="font-mono text-xs tracking-[0.4em] text-iris/70 uppercase mb-6">
              El concepto
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-white leading-tight mb-8">
              Una noche que no se puede describir.<br />
              <span className="italic text-white/40">Solo vivir.</span>
            </h2>
          </div>
          <div>
            <p className="font-body text-white/50 text-lg leading-relaxed">
              {event.description}
            </p>
            {event.location_detail && (
              <div className="mt-8 glass rounded-xl p-4">
                <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-1">Venue</p>
                <p className="text-white/70 font-body">{event.location_detail}</p>
              </div>
            )}
          </div>
        </div>

        <div className="line-holo mt-16" />
      </section>

      {/* ── Tickets section ──────────────────────────── */}
      <section id="tickets" className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-4">
            Acceso
          </p>
          <h2 className="font-display text-5xl font-light text-white">
            Elige tu entrada
          </h2>

          {/* Sold progress */}
          {totalCapacity > 0 && (
            <div className="mt-8 max-w-xs mx-auto">
              <div className="flex justify-between text-xs font-mono text-white/30 mb-2">
                <span>{totalSold} vendidos</span>
                <span>{totalCapacity - totalSold} disponibles</span>
              </div>
              <div className="h-px bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-iris to-aurora transition-all duration-1000"
                  style={{ width: `${soldPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className={`grid gap-4 ${tiers.length === 1 ? 'max-w-sm mx-auto' : tiers.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              eventId={event.id}
              eventName={event.name}
              onSelect={setSelectedTier}
            />
          ))}
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-16">
          {[
            { icon: '🔒', text: 'Pago seguro SSL' },
            { icon: '📱', text: 'QR en tu teléfono' },
            { icon: '✉️', text: 'Email inmediato' },
            { icon: '💬', text: 'Confirmación WhatsApp' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-white/30">
              <span>{item.icon}</span>
              <span className="font-body text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Image src="/logo.png" alt="Pipe Santos" width={100} height={38} className="opacity-20" />
          <p className="font-mono text-white/20 text-xs tracking-wider">
            {event.date} · {event.location}
          </p>
        </div>
      </footer>

      {/* Checkout Modal */}
      {selectedTier && (
        <CheckoutModal
          tier={selectedTier}
          eventId={event.id}
          eventName={event.name}
          onClose={() => setSelectedTier(null)}
        />
      )}
    </main>
  )
}
