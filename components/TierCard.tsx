'use client'
import { useState } from 'react'
import { TicketTier } from '@/lib/types'

interface TierCardProps {
  tier: TicketTier
  eventId: string
  eventName: string
  onSelect: (tier: TicketTier) => void
}

export default function TierCard({ tier, onSelect }: TierCardProps) {
  const [hovered, setHovered] = useState(false)
  const available = tier.total_quantity - tier.sold_quantity
  const soldOut = available <= 0
  const almostGone = available > 0 && available <= 10

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'cop') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(price / 100)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-500 cursor-pointer ${
        soldOut ? 'opacity-40 cursor-not-allowed' : ''
      }`}
      style={{
        background: hovered && !soldOut
          ? `rgba(${hexToRgb(tier.color)}, 0.08)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered && !soldOut ? tier.color + '40' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered && !soldOut ? `0 0 40px ${tier.color}20` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !soldOut && onSelect(tier)}
    >
      {/* Color dot */}
      <div
        className="w-2 h-2 rounded-full mb-4 animate-pulse-glow"
        style={{ background: tier.color, boxShadow: `0 0 10px ${tier.color}` }}
      />

      <h3 className="font-display text-xl text-white mb-1">{tier.name}</h3>

      {tier.description && (
        <p className="text-white/40 text-sm mb-4 font-body">{tier.description}</p>
      )}

      <div className="flex items-end justify-between mt-auto">
        <div>
          <p
            className="font-display text-2xl font-light"
            style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : tier.color }}
          >
            {formatPrice(tier.price, tier.currency)}
          </p>
          {almostGone && !soldOut && (
            <p className="text-xs text-amber-400 mt-1 font-mono tracking-wider">
              ◆ Solo quedan {available}
            </p>
          )}
        </div>

        {soldOut ? (
          <span className="text-xs text-white/30 font-mono tracking-widest uppercase border border-white/10 px-3 py-1 rounded-full">
            Agotado
          </span>
        ) : (
          <button
            className="text-xs font-mono tracking-widest uppercase px-4 py-2 rounded-full transition-all duration-300"
            style={{
              background: hovered ? tier.color : 'transparent',
              border: `1px solid ${tier.color}60`,
              color: hovered ? 'black' : tier.color,
            }}
          >
            Elegir
          </button>
        )}
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '123,104,255'
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
}
