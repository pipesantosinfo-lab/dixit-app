'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────────── */

type Raffle = {
  id: number
  name: string
  status: 'open' | 'closed' | 'finished'
  winner_ticket: string | null
  winner_name: string | null
  spun_at: string | null
  created_at: string
}

type Entry = {
  id: number
  ticket_number: string
  participant_name: string
  joined_at: string
}

/* ─────────────────────────────────────────────────────────────────── */

export default function SorteoPage() {
  const [pin, setPin] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)

  const [raffle, setRaffle] = useState<Raffle | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [newName, setNewName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<{ ticket: string; name: string } | null>(null)
  const [presentMode, setPresentMode] = useState(false)

  const authToken = useRef('')

  /* ── API helpers ──────────────────────────────────────────────── */

  const apiGet = useCallback(async () => {
    const res = await fetch('/api/admin/raffle', {
      headers: { Authorization: `Bearer ${authToken.current}` },
    })
    if (res.status === 401) {
      setAuthenticated(false)
      authToken.current = ''
      return null
    }
    if (!res.ok) return null
    return res.json()
  }, [])

  const refresh = useCallback(async () => {
    const data = await apiGet()
    if (!data) return
    setRaffle(data.raffle)
    setEntries(data.entries ?? [])
    if (data.raffle?.status === 'finished' && data.raffle.winner_ticket && !spinning) {
      setWinner({ ticket: data.raffle.winner_ticket, name: data.raffle.winner_name ?? '' })
    }
  }, [apiGet, spinning])

  /* ── Auth ─────────────────────────────────────────────────────── */

  const handleAuth = async () => {
    if (!pin.trim()) return
    setPinLoading(true)
    setPinError('')
    try {
      const res = await fetch('/api/admin/raffle', {
        headers: { Authorization: `Bearer ${pin}` },
      })
      if (res.ok) {
        authToken.current = pin
        setAuthenticated(true)
        const data = await res.json()
        setRaffle(data.raffle)
        setEntries(data.entries ?? [])
        if (data.raffle?.status === 'finished' && data.raffle.winner_ticket) {
          setWinner({ ticket: data.raffle.winner_ticket, name: data.raffle.winner_name ?? '' })
        }
      } else {
        setPinError('PIN incorrecto')
      }
    } catch {
      setPinError('Error de conexión')
    } finally {
      setPinLoading(false)
    }
  }

  /* ── Polling cuando hay sorteo activo ─────────────────────────── */

  useEffect(() => {
    if (!authenticated) return
    if (spinning) return
    const id = setInterval(() => { refresh().catch(() => {}) }, 2000)
    return () => clearInterval(id)
  }, [authenticated, spinning, refresh])

  /* ── Acciones ─────────────────────────────────────────────────── */

  const createRaffle = async () => {
    if (!newName.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/raffle', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setRaffle(data.raffle)
        setEntries([])
        setWinner(null)
        setNewName('')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const closeRaffle = async () => {
    if (!raffle) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/raffle', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: raffle.id, action: 'close' }),
      })
      if (res.ok) {
        const data = await res.json()
        setRaffle(data.raffle)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const spinRoulette = async () => {
    if (!raffle || entries.length === 0) return
    setActionLoading(true)
    setSpinning(true)
    setWinner(null)

    try {
      const res = await fetch('/api/admin/raffle/spin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: raffle.id }),
      })
      if (!res.ok) {
        setSpinning(false)
        return
      }
      const data = await res.json()
      setWinner({ ticket: data.winner_ticket, name: data.winner_name })
      // El componente Roulette se encarga de animar y al terminar setSpinning(false)
    } catch {
      setSpinning(false)
    } finally {
      setActionLoading(false)
    }
  }

  const onSpinComplete = useCallback(() => {
    setSpinning(false)
    refresh().catch(() => {})
  }, [refresh])

  /* ── UI: Login ────────────────────────────────────────────────── */

  if (!authenticated) {
    return (
      <main className="grain min-h-screen flex items-center justify-center px-6" style={{ background: '#070508' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/logo-header-v2.png" alt="Pipe Santos" width={300} height={130} className="h-12 w-auto opacity-80 mx-auto mb-6" />
            <h1 className="font-display text-3xl text-white mb-2">Sorteos en vivo</h1>
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Panel del show</p>
          </div>
          <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
            <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-3">PIN</label>
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              placeholder="••••••••"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/20 text-lg outline-none mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${pinError ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.08)'}` }}
            />
            {pinError && <p className="text-red-400 text-sm mb-4">{pinError}</p>}
            <button onClick={handleAuth} disabled={pinLoading} className="btn-primary w-full">
              <span>{pinLoading ? 'Verificando...' : 'Entrar'}</span>
            </button>
          </div>
        </div>
      </main>
    )
  }

  /* ── UI: Spinning ─────────────────────────────────────────────── */

  if (spinning && raffle && winner) {
    return (
      <main className="grain min-h-screen flex items-center justify-center px-6 py-8" style={{ background: '#070508' }}>
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <p className="font-mono text-xs tracking-[0.4em] uppercase mb-3" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Sorteando</p>
            <h2 className="font-display text-2xl md:text-4xl text-white font-light">{raffle.name}</h2>
          </div>
          <Roulette
            participants={entries}
            winner={{ ticket_number: winner.ticket, participant_name: winner.name }}
            onComplete={onSpinComplete}
          />
        </div>
      </main>
    )
  }

  /* ── UI: Modo presentación (cuando hay ganador) ──────────────── */

  if (presentMode && raffle?.status === 'finished' && raffle.winner_name) {
    return (
      <main className="grain min-h-screen flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden" style={{ background: '#070508' }}>
        <Confetti />
        <div className="relative z-10 text-center">
          <p className="font-mono text-xs tracking-[0.5em] uppercase mb-6" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Ganador del sorteo</p>
          <p className="font-body text-white/50 text-lg md:text-2xl mb-8">{raffle.name}</p>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="my-8"
          >
            <div className="text-7xl md:text-9xl mb-6">🎉</div>
            <h1 className="font-display text-5xl md:text-7xl text-white font-light mb-4" style={{ textShadow: '0 0 60px rgba(139,60,247,0.6)' }}>
              {raffle.winner_name}
            </h1>
            <p className="font-mono text-sm md:text-base text-white/40 tracking-wider">
              Ticket · {raffle.winner_ticket?.slice(-6).toUpperCase()}
            </p>
          </motion.div>
          <button
            onClick={() => setPresentMode(false)}
            className="mt-10 font-mono text-xs tracking-widest uppercase text-white/40 hover:text-white/70 transition-colors"
          >
            ← Salir de presentación
          </button>
        </div>
      </main>
    )
  }

  /* ── UI: Panel principal ──────────────────────────────────────── */

  return (
    <main className="grain min-h-screen px-4 py-6" style={{ background: '#070508' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Image src="/logo-header-v2.png" alt="Pipe Santos" width={300} height={130} className="h-9 w-auto opacity-60" />
          <div className="text-right">
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Sorteos</p>
            <p className="font-mono text-xs" style={{ color: 'rgba(139,60,247,0.6)' }}>en vivo</p>
          </div>
        </div>

        {/* Estado: sin sorteo o sorteo anterior terminado */}
        {(!raffle || raffle.status === 'finished') && (
          <>
            {raffle?.status === 'finished' && raffle.winner_name && (
              <div className="rounded-2xl p-5 mb-6 text-center"
                style={{ background: 'rgba(0,200,100,0.06)', border: '1px solid rgba(0,200,100,0.3)' }}>
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-mono text-xs tracking-widest text-white/40 uppercase mb-1">Último ganador</p>
                <p className="font-display text-xl text-white">{raffle.winner_name}</p>
                <p className="font-body text-white/50 text-sm">{raffle.name}</p>
                <button
                  onClick={() => setPresentMode(true)}
                  className="mt-4 font-mono text-xs tracking-widest uppercase transition-colors"
                  style={{ color: 'rgba(139,60,247,0.85)' }}
                >
                  📺 Modo presentación
                </button>
              </div>
            )}

            <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
              <p className="font-mono text-xs tracking-[0.3em] uppercase mb-4" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Crear nuevo sorteo</p>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newName.trim() && createRaffle()}
                placeholder="Ej: Pregunta sorpresa"
                maxLength={120}
                className="w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/20 outline-none mb-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={createRaffle}
                disabled={!newName.trim() || actionLoading}
                className="btn-primary w-full disabled:opacity-40"
              >
                <span>{actionLoading ? 'Creando...' : 'Abrir sorteo 🎰'}</span>
              </button>
              <p className="text-xs text-white/30 font-body mt-3 text-center">
                Los asistentes verán un botón en su entrada para participar
              </p>
            </div>
          </>
        )}

        {/* Estado: sorteo open (inscripciones abiertas) */}
        {raffle?.status === 'open' && (
          <>
            <div className="rounded-2xl p-6 mb-4"
              style={{ background: 'rgba(139,60,247,0.08)', border: '1px solid rgba(139,60,247,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs tracking-widest uppercase" style={{ color: 'rgba(139,60,247,0.85)' }}>● En vivo</span>
                <span className="text-xs text-white/40 font-mono">Sorteo #{raffle.id}</span>
              </div>
              <h2 className="font-display text-2xl text-white font-light mb-1">{raffle.name}</h2>
              <p className="font-body text-white/50 text-sm">Inscripciones abiertas</p>
            </div>

            {/* Counter gigante */}
            <div className="text-center my-8">
              <p className="font-mono text-xs tracking-[0.4em] uppercase text-white/40 mb-3">Participantes</p>
              <motion.p
                key={entries.length}
                initial={{ scale: 1.2, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="font-display text-7xl text-white font-light"
                style={{ textShadow: '0 0 40px rgba(139,60,247,0.4)' }}
              >
                {entries.length}
              </motion.p>
            </div>

            {/* Lista de los últimos en inscribirse */}
            {entries.length > 0 && (
              <div className="glass rounded-2xl p-4 mb-4 max-h-48 overflow-y-auto" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-mono text-xs tracking-widest text-white/40 uppercase mb-3">Inscritos</p>
                <ul className="space-y-2">
                  {entries.slice(0, 30).map((e) => (
                    <li key={e.id} className="font-body text-white/80 text-sm flex items-center justify-between">
                      <span>{e.participant_name}</span>
                      <span className="font-mono text-xs text-white/30">{e.ticket_number.slice(-6)}</span>
                    </li>
                  ))}
                  {entries.length > 30 && (
                    <li className="font-mono text-xs text-white/30 text-center pt-2">y {entries.length - 30} más...</li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={closeRaffle}
              disabled={actionLoading}
              className="btn-primary w-full"
            >
              <span>{actionLoading ? '...' : 'Cerrar inscripciones'}</span>
            </button>
          </>
        )}

        {/* Estado: closed (esperando girar) */}
        {raffle?.status === 'closed' && (
          <>
            <div className="rounded-2xl p-6 mb-6 text-center"
              style={{ background: 'rgba(139,60,247,0.08)', border: '1px solid rgba(139,60,247,0.3)' }}>
              <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(139,60,247,0.85)' }}>Listo para girar</p>
              <h2 className="font-display text-2xl text-white font-light mb-2">{raffle.name}</h2>
              <p className="font-body text-white/50 text-sm">{entries.length} participantes</p>
            </div>

            <button
              onClick={spinRoulette}
              disabled={actionLoading || entries.length === 0}
              className="btn-primary w-full py-6 text-lg disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #C45200, #E07820)' }}
            >
              <span className="text-xl">🎰 GIRAR LA RULETA</span>
            </button>

            {entries.length === 0 && (
              <p className="text-xs text-yellow-400/70 text-center mt-4 font-mono">
                ⚠ No hay participantes inscritos
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Componente: Ruleta animada (slot machine)
   ──────────────────────────────────────────────────────────────────── */

const FRAME_HEIGHT = 96
const VISIBLE_FRAMES = 3 // mostramos 3 a la vez, el del medio es el "actual"
const TOTAL_FRAMES = 80 // total de iteraciones antes de aterrizar

function Roulette({
  participants,
  winner,
  onComplete,
}: {
  participants: Entry[]
  winner: { ticket_number: string; participant_name: string }
  onComplete: () => void
}) {
  const [showWinner, setShowWinner] = useState(false)

  // Build frames: random shuffles + winner at the end
  const frames = useMemo(() => {
    const pool = participants.length > 0 ? participants : [{
      id: 0, ticket_number: winner.ticket_number, participant_name: winner.participant_name, joined_at: '',
    } as Entry]
    const arr: Entry[] = []
    for (let i = 0; i < TOTAL_FRAMES - 1; i++) {
      arr.push(pool[Math.floor(Math.random() * pool.length)])
    }
    arr.push({
      id: -1,
      ticket_number: winner.ticket_number,
      participant_name: winner.participant_name,
      joined_at: '',
    })
    return arr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Offset final: el winner está en TOTAL_FRAMES - 1.
  // Queremos que el winner quede en la posición central (índice 1 visible de 3).
  // El strip se traslada -((TOTAL_FRAMES - 1) - 1) * FRAME_HEIGHT
  const finalOffset = (TOTAL_FRAMES - 2) * FRAME_HEIGHT

  // Cuando termina la animación
  const handleAnimationComplete = () => {
    setShowWinner(true)
    // Pequeño delay antes de notificar al padre
    setTimeout(onComplete, 4000)
  }

  return (
    <div className="relative">
      {/* Ventana del slot */}
      <div
        className="relative mx-auto rounded-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '520px',
          height: `${FRAME_HEIGHT * VISIBLE_FRAMES}px`,
          background: 'linear-gradient(180deg, rgba(139,60,247,0.08) 0%, rgba(139,60,247,0.18) 50%, rgba(139,60,247,0.08) 100%)',
          border: '1px solid rgba(139,60,247,0.4)',
          boxShadow: '0 0 40px rgba(139,60,247,0.3), inset 0 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Strip de nombres */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: -finalOffset }}
          transition={{ duration: 5.5, ease: [0.13, 0.74, 0.27, 1] }}
          onAnimationComplete={handleAnimationComplete}
          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        >
          {frames.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-center font-display text-white"
              style={{
                height: `${FRAME_HEIGHT}px`,
                fontSize: 'clamp(20px, 5vw, 34px)',
                fontWeight: 300,
                letterSpacing: '0.5px',
              }}
            >
              {f.participant_name}
            </div>
          ))}
        </motion.div>

        {/* Highlight bar central */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${FRAME_HEIGHT}px`,
            height: `${FRAME_HEIGHT}px`,
            background: 'linear-gradient(180deg, transparent 0%, rgba(139,60,247,0.15) 50%, transparent 100%)',
            borderTop: '1px solid rgba(139,60,247,0.4)',
            borderBottom: '1px solid rgba(139,60,247,0.4)',
          }}
        />

        {/* Fade arriba y abajo */}
        <div className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: `${FRAME_HEIGHT}px`,
            background: 'linear-gradient(180deg, #070508 0%, transparent 100%)',
          }} />
        <div className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: `${FRAME_HEIGHT}px`,
            background: 'linear-gradient(0deg, #070508 0%, transparent 100%)',
          }} />
      </div>

      {/* Anuncio del ganador cuando termina */}
      <AnimatePresence>
        {showWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mt-10 relative"
          >
            <Confetti />
            <div className="text-7xl mb-4">🎉</div>
            <p className="font-mono text-xs tracking-[0.4em] uppercase text-aurora/80 mb-3">El ganador es</p>
            <h2 className="font-display text-4xl md:text-6xl text-white font-light mb-3"
              style={{ textShadow: '0 0 60px rgba(139,60,247,0.7)' }}>
              {winner.participant_name}
            </h2>
            <p className="font-mono text-sm text-white/40 tracking-wider">
              Ticket · {winner.ticket_number.slice(-6).toUpperCase()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Componente: Confetti CSS puro
   ──────────────────────────────────────────────────────────────────── */

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2.5 + Math.random() * 1.5,
    color: ['#8B3CF7', '#C45200', '#E07820', '#22d3ee', '#facc15', '#f472b6'][i % 6],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  })), [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ minHeight: '300px' }}>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -50, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 400, opacity: 0, rotate: p.rotation + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  )
}
