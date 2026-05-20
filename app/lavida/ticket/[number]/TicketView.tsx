'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { generateQRDataURL } from '@/lib/qr'

interface Ticket {
  ticket_number: string
  buyer_name: string
  buyer_email: string
  status: string
  qr_data: string
  created_at: string
}

export default function TicketView({ ticket }: { ticket: Ticket }) {
  const [qrUrl, setQrUrl] = useState('')
  const isUsed = ticket.status === 'used'
  const shortId = ticket.ticket_number.split('-')[0].toUpperCase()

  useEffect(() => {
    if (ticket.qr_data) generateQRDataURL(ticket.qr_data).then(url => {
      setQrUrl(url)
      if (!isUsed) playApprovedSound()
    })
  }, [ticket.qr_data])

  function playApprovedSound() {
    try {
      const ctx = new AudioContext()
      const notes = [523.25, 783.99] // C5 → G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.18
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
        osc.start(t)
        osc.stop(t + 0.55)
      })
    } catch {}
  }

  return (
    <main className="grain min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#070508' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,60,247,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {isUsed && (
          <div className="mb-4 rounded-xl px-4 py-3 text-center font-mono text-xs tracking-widest uppercase"
            style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: 'rgba(255,100,100,0.8)' }}>
            ✗ Entrada ya utilizada
          </div>
        )}

        {/* Ticket Card */}
        <div className="rounded-3xl overflow-hidden" style={{
          background: 'linear-gradient(145deg, #0d0a14, #140e20)',
          border: '1px solid rgba(139,60,247,0.25)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 50px rgba(139,60,247,0.08)',
          filter: isUsed ? 'grayscale(0.6) opacity(0.6)' : 'none',
        }}>
          {/* Header */}
          <div className="relative h-32 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center bg-top" style={{ backgroundImage: "url('/hero.jpg')" }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,5,8,0.3), rgba(13,10,20,0.95))' }} />
            <div className="absolute bottom-4 left-6 right-6">
              <p className="font-mono text-xs tracking-[0.3em] uppercase mb-1" style={{ color: 'rgba(139,60,247,0.9)' }}>Entrada General</p>
              <h1 className="font-display text-xl font-light text-white">La vida es cule viaje</h1>
            </div>
          </div>

          {/* Perforated divider */}
          <div className="relative flex items-center px-6 py-4" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
            <div className="absolute -left-3 w-6 h-6 rounded-full" style={{ background: '#070508' }} />
            <div className="absolute -right-3 w-6 h-6 rounded-full" style={{ background: '#070508' }} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,60,247,0.3), transparent)' }} />
          </div>

          {/* QR */}
          <div className="px-6 pb-6">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl" style={{ boxShadow: '0 0 30px rgba(139,60,247,0.25)', border: '1px solid rgba(139,60,247,0.2)' }} />
                <div className="bg-white rounded-xl p-3 relative z-10">
                  {qrUrl
                    ? <img src={qrUrl} alt="QR" width={180} height={180} className="block" />
                    : <div className="w-[180px] h-[180px] flex items-center justify-center">
                        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#8B3CF7 transparent transparent transparent' }} />
                      </div>
                  }
                </div>
              </div>
            </div>

            <p className="text-center font-mono text-xs tracking-[0.3em] mb-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {shortId}
            </p>

            <div className="space-y-3">
              {[
                { label: 'Asistente', value: ticket.buyer_name },
                { label: 'Fecha', value: 'Sáb 22 ago 2026 · 2:00 PM', highlight: true },
                { label: 'Lugar', value: 'Barranquilla, Colombia' },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-mono text-xs text-white/30 tracking-widest uppercase">{label}</span>
                  <span className="font-body text-sm" style={{ color: highlight ? '#8B3CF7' : 'rgba(255,255,255,0.7)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-2" style={{ background: 'linear-gradient(90deg, rgba(139,60,247,0.6), rgba(196,82,0,0.4), transparent)' }} />
        </div>

        <p className="text-center font-body text-white/20 text-xs mt-6 leading-relaxed">
          Muestra este QR en la entrada · Válido para una persona
        </p>
        <p className="text-center font-mono text-xs mt-3" style={{ color: 'rgba(139,60,247,0.4)' }}>
          ◆ Guarda esta página como captura de pantalla
        </p>

        <div className="flex justify-center mt-6">
          <Image src="/logo.png" alt="Pipe Santos" width={80} height={30} className="opacity-20" />
        </div>
      </div>
    </main>
  )
}
