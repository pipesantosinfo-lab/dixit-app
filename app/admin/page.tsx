'use client'
import { useState, useEffect, useRef } from 'react'

interface Ticket {
  id: string
  ticket_number: string
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  status: string
  created_at: string
  ticket_tiers: { name: string; color: string }
  events: { name: string }
}

interface LaVidaTicket {
  ticket_number: string
  buyer_name: string
  buyer_email: string
  buyer_cedula: string | null
  buyer_phone: string | null
  bold_order_id: string | null
  status: string
  payment_method: string | null
  paid_at: string | null
}

interface Stats {
  total: number
  used: number
  active: number
}

const PAYMENT_LABELS: Record<string, string> = {
  PSE: 'PSE', CREDIT_CARD: 'T. Crédito', DEBIT_CARD: 'T. Débito',
  NEQUI: 'Nequi', DAVIPLATA: 'Daviplata', BANCOLOMBIA_TRANSFER: 'Bancolombia',
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [lavidaTickets, setLavidaTickets] = useState<LaVidaTicket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [lavidaStats, setLavidaStats] = useState({ total: 0, used: 0, pending: 0 })
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [scanInput, setScanInput] = useState('')
  const [scanResult, setScanResult] = useState<{
    valid: boolean; message: string; buyer?: string; tier?: string
  } | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)

  const fetchTickets = async (s: string) => {
    setLoading(true)
    const [res, lavidaRes] = await Promise.all([
      fetch('/api/admin/tickets', { headers: { Authorization: `Bearer ${s}` } }),
      fetch('/api/admin/lavida',  { headers: { Authorization: `Bearer ${s}` } }),
    ])
    if (res.ok) {
      const data = await res.json()
      setTickets(data.tickets ?? [])
      setStats(data.stats)
      setAuthed(true)
    } else {
      alert('Contraseña incorrecta')
      setLoading(false)
      return
    }
    if (lavidaRes.ok) {
      const ldata = await lavidaRes.json()
      setLavidaTickets(ldata.tickets ?? [])
      setLavidaStats(ldata.stats ?? { total: 0, used: 0, pending: 0 })
    }
    setLoading(false)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/export', {
        headers: { Authorization: `Bearer ${secret}` },
      })
      if (!res.ok) { alert('Error al exportar'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `asistentes-lavida-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Error al exportar') }
    finally { setExporting(false) }
  }

  const handleValidate = async () => {
    if (!scanInput.trim()) return
    // Extract ticket number from URL if needed
    const ticketNumber = scanInput.includes('/ticket/')
      ? scanInput.split('/ticket/')[1]
      : scanInput.trim()

    const res = await fetch('/api/validate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ ticketNumber }),
    })
    const data = await res.json()
    setScanResult(data)
    setScanInput('')
    if (data.valid) {
      fetchTickets(secret)
      setTimeout(() => setScanResult(null), 4000)
    }
    scanRef.current?.focus()
  }

  const filtered = tickets.filter(t =>
    t.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
    t.buyer_email.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_number.includes(search.toLowerCase())
  )

  if (!authed) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="font-mono text-xs text-white/30 tracking-widest uppercase text-center mb-6">
            Admin · Acceso restringido
          </p>
          <div className="glass rounded-2xl p-8">
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchTickets(secret)}
              placeholder="Contraseña admin"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm mb-4 focus:outline-none focus:border-iris"
            />
            <button
              onClick={() => fetchTickets(secret)}
              disabled={loading}
              className="w-full btn-primary"
            >
              <span>{loading ? 'Verificando...' : 'Entrar'}</span>
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Agrupar lavida_tickets por orden para la tabla (una fila por compra)
  const lavidaOrders = (() => {
    const map = new Map<string, { name: string; email: string; cedula: string; phone: string; qty: number; method: string; date: string; status: string }>()
    for (const t of lavidaTickets) {
      const key = t.bold_order_id ?? t.ticket_number
      if (!map.has(key)) {
        map.set(key, {
          name:   t.buyer_name,
          email:  t.buyer_email,
          cedula: t.buyer_cedula ?? '-',
          phone:  t.buyer_phone  ?? '-',
          qty:    0,
          method: PAYMENT_LABELS[t.payment_method ?? ''] ?? (t.payment_method ?? 'Bold'),
          date:   t.paid_at ? new Date(t.paid_at).toLocaleDateString('es-CO') : '-',
          status: t.status,
        })
      }
      map.get(key)!.qty++
    }
    return Array.from(map.values())
  })()

  const filteredLavida = lavidaOrders.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    o.cedula.includes(search)
  )

  return (
    <main className="grain min-h-screen bg-void px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-1">Panel de control</p>
            <h1 className="font-display text-3xl text-white">Administración</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} disabled={exporting}
              className="btn-primary text-sm disabled:opacity-50"
              title="Descarga Excel con todos los asistentes de La Vida">
              <span>{exporting ? '⏳ Generando...' : '📥 Exportar Excel'}</span>
            </button>
            <button onClick={() => fetchTickets(secret)} className="btn-ghost text-sm">
              ↻ Actualizar
            </button>
          </div>
        </div>

        {/* ── Stats La Vida ── */}
        <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-3">◆ La vida es cule viaje · Estadísticas</p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Entradas vendidas', value: lavidaStats.total,   color: '#8B3CF7' },
            { label: 'Han ingresado',     value: lavidaStats.used,    color: '#00FFD1' },
            { label: 'Sin ingresar',      value: lavidaStats.pending, color: '#FFD166' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass rounded-2xl p-5 text-center">
              <p className="font-display text-4xl mb-1" style={{ color }}>{value}</p>
              <p className="font-mono text-xs text-white/30 tracking-wider uppercase">{label}</p>
            </div>
          ))}
        </div>

        {/* ── QR Scanner ── */}
        <div className="glass rounded-2xl p-6 mb-8">
          <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-4">Validar QR en puerta</p>
          <div className="flex gap-3">
            <input ref={scanRef} type="text" value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleValidate()}
              placeholder="Escanea el QR o pega el código..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-iris font-mono"
            />
            <button onClick={handleValidate} className="btn-primary whitespace-nowrap">
              <span>Validar</span>
            </button>
          </div>
          {scanResult && (
            <div className="mt-4 rounded-xl px-5 py-4 flex items-center gap-3"
              style={{
                background: scanResult.valid ? 'rgba(0,255,209,0.08)' : 'rgba(255,80,80,0.08)',
                border: `1px solid ${scanResult.valid ? 'rgba(0,255,209,0.25)' : 'rgba(255,80,80,0.25)'}`,
              }}>
              <span className="text-2xl">{scanResult.valid ? '✓' : '✗'}</span>
              <div>
                <p className="font-body text-white/90 font-medium">{scanResult.message}</p>
                {scanResult.buyer && <p className="font-mono text-xs text-white/40 mt-1">{scanResult.buyer}</p>}
              </div>
            </div>
          )}
        </div>

        {/* ── Tabla asistentes La Vida ── */}
        <div className="glass rounded-2xl overflow-hidden mb-10">
          <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o cédula..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:border-iris"
            />
            <span className="font-mono text-xs text-white/30 whitespace-nowrap">
              {filteredLavida.length} compras · {lavidaStats.total} entradas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Nombre', 'Cédula', 'Correo', 'Entradas', 'Medio de pago', 'Estado', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-mono text-xs text-white/30 tracking-widest uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLavida.map((o, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-body text-white/80 text-sm whitespace-nowrap">{o.name}</td>
                    <td className="px-4 py-3 font-mono text-white/40 text-xs">{o.cedula}</td>
                    <td className="px-4 py-3 font-body text-white/40 text-sm">{o.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-display text-lg" style={{ color: '#8B3CF7' }}>{o.qty}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/50 whitespace-nowrap">{o.method}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs px-2 py-1 rounded-full ${
                        o.status === 'used'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-iris/10 text-iris border border-iris/20'
                      }`}>
                        {o.status === 'used' ? '✓ Ingresó' : '● Activa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/25 whitespace-nowrap">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLavida.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/20 font-body">
                {lavidaTickets.length === 0 ? 'Aún no hay ventas registradas' : 'Sin resultados'}
              </p>
            </div>
          )}
        </div>

        {/* ── Tabla Stripe (eventos anteriores) ── */}
        {tickets.length > 0 && (
          <>
            <p className="font-mono text-xs text-white/20 tracking-widest uppercase mb-3">◆ Otros eventos (Stripe)</p>
            <div className="glass rounded-2xl overflow-hidden opacity-60">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Nombre', 'Email', 'Tier', 'Estado', 'ID'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-mono text-xs text-white/30 tracking-widest uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.filter(t =>
                      t.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
                      t.buyer_email.toLowerCase().includes(search.toLowerCase())
                    ).map((t) => (
                      <tr key={t.id} className="border-b border-white/5">
                        <td className="px-4 py-3 font-body text-white/70 text-sm">{t.buyer_name}</td>
                        <td className="px-4 py-3 font-body text-white/30 text-sm">{t.buyer_email}</td>
                        <td className="px-4 py-3 font-mono text-xs text-white/30">{t.ticket_tiers?.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-white/30">{t.status}</td>
                        <td className="px-4 py-3 font-mono text-xs text-white/20">{t.ticket_number.split('-')[0].toUpperCase()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  )
}
