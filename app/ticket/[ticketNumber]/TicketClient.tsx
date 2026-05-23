'use client'
import { useEffect, useState } from 'react'
import { generateQRDataURL } from '@/lib/qr'

interface Props {
  ticket: {
    ticket_number: string
    buyer_name: string
    // buyer_email excluido deliberadamente — no se serializa en el cliente (privacidad)
    status: string
    created_at: string
    qr_data: string
    ticket_tiers: { name: string; color: string }
    events: { name: string; date: string; location: string; cover_image: string }
  }
}

export default function TicketClient({ ticket }: Props) {
  const [qrUrl, setQrUrl] = useState('')
  const [glowRotation, setGlowRotation] = useState(0)

  const isUsed = ticket.status === 'used'
  const tierColor = ticket.ticket_tiers.color

  useEffect(() => {
    generateQRDataURL(ticket.qr_data).then(setQrUrl)
  }, [ticket.qr_data])

  // Subtle glow rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowRotation(r => (r + 1) % 360)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const shortId = ticket.ticket_number.split('-')[0].toUpperCase()

  return (
    <main className="grain min-h-screen bg-void flex items-center justify-center px-4 py-12">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: `conic-gradient(from ${glowRotation}deg, ${tierColor}30, transparent, ${tierColor}20, transparent)`,
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Used banner */}
        {isUsed && (
          <div className="mb-4 rounded-xl px-4 py-3 text-center font-mono text-xs tracking-widest uppercase"
            style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)', color: 'rgba(255,120,120,0.8)' }}>
            ✗ Entrada utilizada
          </div>
        )}

        {/* The Ticket Card */}
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(145deg, #0f0f1a, #16162a)',
            border: `1px solid ${tierColor}30`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 40px ${tierColor}10`,
            filter: isUsed ? 'grayscale(0.7) opacity(0.6)' : 'none',
          }}
        >
          {/* Header strip with event cover */}
          <div className="relative h-36 overflow-hidden">
            {ticket.events.cover_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ticket.events.cover_image}
                alt={ticket.events.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(to bottom, rgba(3,3,5,0.2), rgba(15,15,26,0.95))`,
            }} />
            {/* Event name overlay */}
            <div className="absolute bottom-4 left-6 right-6">
              <p className="font-mono text-xs tracking-[0.3em] uppercase mb-1"
                style={{ color: tierColor + 'cc' }}>
                {ticket.ticket_tiers.name}
              </p>
              <h1 className="font-display text-2xl font-light text-white leading-tight">
                {ticket.events.name}
              </h1>
            </div>
          </div>

          {/* Perforated divider */}
          <div className="relative flex items-center mx-0 py-4 px-6"
            style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
            {/* Left notch */}
            <div className="absolute -left-3 w-6 h-6 rounded-full"
              style={{ background: '#030305' }} />
            {/* Right notch */}
            <div className="absolute -right-3 w-6 h-6 rounded-full"
              style={{ background: '#030305' }} />
            <div className="flex-1 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${tierColor}30, transparent)` }} />
          </div>

          {/* QR Section */}
          <div className="px-6 pb-6">
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Glow ring around QR */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-40"
                  style={{
                    boxShadow: `0 0 30px ${tierColor}40`,
                    border: `1px solid ${tierColor}30`,
                  }}
                />
                <div className="bg-white rounded-xl p-3 relative z-10">
                  {qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrUrl} alt="QR" width={180} height={180} className="block" />
                  ) : (
                    <div className="w-[180px] h-[180px] flex items-center justify-center">
                      <div className="w-6 h-6 border-2 rounded-full border-t-transparent animate-spin"
                        style={{ borderColor: `${tierColor} transparent transparent transparent` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket ID */}
            <p className="text-center font-mono text-xs tracking-[0.3em] mb-6"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              {ticket.ticket_number.toUpperCase()}
            </p>

            {/* Details grid */}
            <div className="space-y-3">
              {[
                { label: 'Asistente', value: ticket.buyer_name },
                { label: 'Fecha', value: ticket.events.date, highlight: true },
                { label: 'Lugar', value: ticket.events.location },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-mono text-xs text-white/30 tracking-widest uppercase">{label}</span>
                  <span className={`font-body text-sm ${highlight ? '' : 'text-white/70'}`}
                    style={highlight ? { color: tierColor } : {}}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom strip */}
          <div
            className="h-2"
            style={{ background: `linear-gradient(90deg, ${tierColor}60, transparent, ${tierColor}30)` }}
          />
        </div>

        {/* Instructions */}
        <p className="text-center font-body text-white/20 text-xs mt-6 leading-relaxed">
          Muestra este QR en la entrada.<br />
          Válido para una persona · No transferible.
        </p>

        {/* Add to wallet hint */}
        <p className="text-center font-mono text-xs mt-4"
          style={{ color: tierColor + '60' }}>
          ◆ Guarda esta página como screenshot
        </p>
      </div>
    </main>
  )
}
