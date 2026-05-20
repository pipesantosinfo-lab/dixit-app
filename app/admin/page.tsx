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

interface Stats {
  total: number
  used: number
  active: number
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [scanInput, setScanInput] = useState('')
  const [scanResult, setScanResult] = useState<{
    valid: boolean; message: string; buyer?: string; tier?: string
  } | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)

  const fetchTickets = async (s: string) => {
    setLoading(true)
    const res = await fetch(`/api/admin/tickets?secret=${s}`)
    if (res.ok) {
      const data = await res.json()
      setTickets(data.tickets)
      setStats(data.stats)
      setAuthed(true)
    } else {
      alert('Contraseña incorrecta')
    }
    setLoading(false)
  }

  const handleValidate = async () => {
    if (!scanInput.trim()) return
    // Extract ticket number from URL if needed
    const ticketNumber = scanInput.includes('/ticket/')
      ? scanInput.split('/ticket/')[1]
      : scanInput.trim()

    const res = await fetch('/api/validate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketNumber, adminSecret: secret }),
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

  return (
    <main className="grain min-h-screen bg-void px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-1">Panel de control</p>
            <h1 className="font-display text-3xl text-white">Asistentes</h1>
          </div>
          <button
            onClick={() => fetchTickets(secret)}
            className="btn-ghost text-sm"
          >
            ↻ Actualizar
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total vendidos', value: stats.total, color: '#7B68FF' },
              { label: 'Han ingresado', value: stats.used, color: '#00FFD1' },
              { label: 'Pendientes', value: stats.active, color: '#FFD166' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass rounded-2xl p-5 text-center">
                <p className="font-display text-3xl mb-1" style={{ color }}>{value}</p>
                <p className="font-mono text-xs text-white/30 tracking-wider uppercase">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* QR Scanner */}
        <div className="glass rounded-2xl p-6 mb-8">
          <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-4">
            Validar QR en puerta
          </p>
          <div className="flex gap-3">
            <input
              ref={scanRef}
              type="text"
              value={scanInput}
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
            <div
              className="mt-4 rounded-xl px-5 py-4 flex items-center gap-3"
              style={{
                background: scanResult.valid ? 'rgba(0,255,209,0.08)' : 'rgba(255,80,80,0.08)',
                border: `1px solid ${scanResult.valid ? 'rgba(0,255,209,0.25)' : 'rgba(255,80,80,0.25)'}`,
              }}
            >
              <span className="text-2xl">{scanResult.valid ? '✓' : '✗'}</span>
              <div>
                <p className="font-body text-white/90 font-medium">{scanResult.message}</p>
                {scanResult.buyer && (
                  <p className="font-mono text-xs text-white/40 mt-1">
                    {scanResult.buyer} · {scanResult.tier}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search + List */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o código..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:border-iris"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Nombre', 'Email', 'Tier', 'Estado', 'ID', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-mono text-xs text-white/30 tracking-widest uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 font-body text-white/80 text-sm">{t.buyer_name}</td>
                    <td className="px-4 py-3 font-body text-white/40 text-sm">{t.buyer_email}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-2 py-1 rounded-full"
                        style={{
                          background: t.ticket_tiers.color + '20',
                          color: t.ticket_tiers.color,
                          border: `1px solid ${t.ticket_tiers.color}30`,
                        }}>
                        {t.ticket_tiers.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs px-2 py-1 rounded-full ${
                        t.status === 'used'
                          ? 'bg-aurora/10 text-aurora border border-aurora/20'
                          : t.status === 'active'
                          ? 'bg-iris/10 text-iris border border-iris/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {t.status === 'used' ? '✓ Ingresó' : t.status === 'active' ? '● Activo' : '✗ Cancelado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/25">
                      {t.ticket_number.split('-')[0].toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/25">
                      {new Date(t.created_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/20 font-body">Sin resultados</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
