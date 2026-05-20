'use client'
import { useState } from 'react'
import { TicketTier } from '@/lib/types'

interface CheckoutModalProps {
  tier: TicketTier
  eventId: string
  eventName: string
  onClose: () => void
}

export default function CheckoutModal({ tier, eventId, eventName, onClose }: CheckoutModalProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'cop') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
      }).format(price / 100)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError('Por favor completa tu nombre y correo.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: tier.id,
          eventId,
          buyerName: form.name,
          buyerEmail: form.email,
          buyerPhone: form.phone,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error desconocido')

      window.location.href = data.url
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(3,3,5,0.85)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 animate-fade-up"
        style={{
          background: 'linear-gradient(135deg, #0f0f1a, #16162a)',
          border: `1px solid ${tier.color}30`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 60px ${tier.color}10`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/40 text-xs tracking-widest uppercase font-mono mb-1">{eventName}</p>
            <h2 className="font-display text-2xl text-white">{tier.name}</h2>
            <p className="font-display text-lg mt-1" style={{ color: tier.color }}>
              {formatPrice(tier.price, tier.currency)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Divider */}
        <div className="line-holo mb-6" />

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-white/40 text-xs tracking-widest uppercase font-mono block mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tu nombre"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-iris transition-colors"
            />
          </div>

          <div>
            <label className="text-white/40 text-xs tracking-widest uppercase font-mono block mb-2">
              Correo electrónico *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tu@correo.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-iris transition-colors"
            />
          </div>

          <div>
            <label className="text-white/40 text-xs tracking-widest uppercase font-mono block mb-2">
              WhatsApp <span className="text-white/20">(opcional, para recibir tu entrada)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+57 300 000 0000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-iris transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 font-body">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? 'Redirigiendo a pago...' : 'Continuar al pago'}</span>
        </button>

        <p className="text-white/20 text-xs text-center mt-4 font-body">
          Pago seguro con Stripe · SSL · 256-bit
        </p>
      </div>
    </div>
  )
}
