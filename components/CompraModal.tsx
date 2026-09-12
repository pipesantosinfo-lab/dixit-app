'use client'
import { useState } from 'react'
import { EVENTO } from '@/lib/evento'

/**
 * Modal de compra de la landing /cartagena. Mismo formulario y misma API
 * (/api/create-order) que el modal de la portada; vive aparte para que la
 * landing no cargue las 4.000 lineas de SitioCompleto.tsx.
 */
export default function CompraModal({ onClose, vendidas }: { onClose: () => void; vendidas: number }) {
  const [form, setForm] = useState({ name: '', email: '', age: '' })
  const [mayor, setMayor] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const disponibles = Math.max(0, EVENTO.aforo - vendidas)
  const maxCantidad = Math.max(1, Math.min(10, disponibles))
  const total = EVENTO.precio * cantidad

  async function comprar() {
    if (!form.name.trim() || !form.email.trim()) { setError('Tu nombre y correo son obligatorios.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Escribe un correo válido: ahí llega tu entrada.'); return }
    const edad = parseInt(form.age)
    if (!form.age.trim() || isNaN(edad) || edad < 18 || edad > 120) { setError('Debes tener 18 años o más para adquirir una entrada.'); return }
    if (!mayor) { setError('Confirma que eres mayor de edad para continuar.'); return }
    setCargando(true); setError('')
    try {
      const r = await fetch('/api/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerName: form.name, buyerEmail: form.email, buyerAge: edad, quantity: cantidad }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Error inesperado')
      window.location.href = d.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Algo salió mal. Intenta de nuevo.')
      setCargando(false)
    }
  }

  const campo = 'w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/25 text-[15px] outline-none transition-colors'
  const campoStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(7,5,8,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        style={{ background: 'linear-gradient(145deg,#0d0a14,#140e20)', border: '1px solid rgba(139,60,247,0.3)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: '#ff9a3c' }}>◆ Entrada general</p>
            <h2 className="font-display text-2xl text-white leading-tight">{EVENTO.nombre}</h2>
            <p className="font-body text-sm text-white/50 mt-1">{EVENTO.fechaCorta} · {EVENTO.horaTexto} · {EVENTO.ciudad}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-white/40 hover:text-white transition-colors text-3xl leading-none -mt-1">×</button>
        </div>

        <div className="flex items-center justify-between mb-4 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="font-body text-white/70 text-sm">Cantidad</p>
            <p className="font-display text-lg" style={{ color: '#C9A7FF' }}>${total.toLocaleString('es-CO')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCantidad(q => Math.max(1, q - 1))} aria-label="Menos" className="w-9 h-9 rounded-lg text-lg"
              style={{ background: 'rgba(139,60,247,0.15)', border: '1px solid rgba(139,60,247,0.3)', color: '#C9A7FF' }}>−</button>
            <span className="font-display text-2xl text-white w-6 text-center">{cantidad}</span>
            <button onClick={() => setCantidad(q => Math.min(maxCantidad, q + 1))} aria-label="Más" className="w-9 h-9 rounded-lg text-lg"
              style={{ background: 'rgba(139,60,247,0.15)', border: '1px solid rgba(139,60,247,0.3)', color: '#C9A7FF' }}>+</button>
          </div>
        </div>

        {disponibles <= 20 && (
          <p className="mb-4 rounded-xl px-4 py-2 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{ background: 'rgba(255,154,60,0.1)', border: '1px solid rgba(255,154,60,0.25)', color: '#ff9a3c' }}>
            ⚡ Últimas entradas
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-white/40 tracking-[2px] uppercase block mb-2">Nombre completo</label>
            <input type="text" autoComplete="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Como aparece en tu documento" className={campo} style={campoStyle} />
          </div>
          <div>
            <label className="font-mono text-[10px] text-white/40 tracking-[2px] uppercase block mb-2">Correo electrónico</label>
            <input type="email" autoComplete="email" inputMode="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Aquí llega tu entrada con el QR" className={campo} style={campoStyle} />
          </div>
          <div>
            <label className="font-mono text-[10px] text-white/40 tracking-[2px] uppercase block mb-2">¿Cuántos años tienes?</label>
            <input type="number" inputMode="numeric" min={1} max={120} value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="Ej: 25" className={campo} style={campoStyle} />
            <p className="font-body text-[12px] text-white/40 mt-2 leading-snug">💛 El show tiene anécdotas y temas para mayores de 18. Te pedirán tu documento al ingresar.</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={mayor} onChange={e => setMayor(e.target.checked)} className="mt-1 w-4 h-4 accent-[#8B3CF7]" />
            <span className="font-body text-[13px] leading-relaxed" style={{ color: mayor ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}>
              Confirmo que soy mayor de edad (18+).
            </span>
          </label>
        </div>

        {error && <p className="text-sm mt-4 font-body" style={{ color: '#ff8c8c' }}>{error}</p>}

        <button onClick={comprar} disabled={cargando} className="landing-cta w-full mt-5 disabled:opacity-60">
          {cargando ? 'Abriendo pago seguro…' : `Pagar $${total.toLocaleString('es-CO')} →`}
        </button>
        <p className="font-body text-[12px] text-white/35 text-center mt-4 leading-relaxed">
          Pago seguro con Bold · Tarjeta o PSE.<br />
          Con tarjeta tu entrada llega al instante; con PSE, apenas tu banco confirme.
        </p>
        <p className="text-center mt-2"><a href="/mi-entrada" className="font-mono text-[11px] text-white/30 hover:text-white/60 underline underline-offset-4">¿Ya compraste y no te llegó el correo?</a></p>
      </div>
    </div>
  )
}
