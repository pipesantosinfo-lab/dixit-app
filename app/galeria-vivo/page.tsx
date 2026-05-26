'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type Photo = {
  id: number
  ticket_number: string
  uploader_name: string
  public_url: string
  created_at: string
}

type Raffle = {
  id: number
  name: string
  winner_photo_id: number | null
  winner_ticket: string | null
  winner_name: string | null
  winner_url: string | null
  spun_at: string | null
  created_at: string
}

export default function GaleriaVivoPage() {
  const [pin, setPin] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [lastRaffle, setLastRaffle] = useState<Raffle | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Photo | null>(null)
  const [presentMode, setPresentMode] = useState(false)
  const [spinName, setSpinName] = useState('')

  const authToken = useRef('')

  /* ── Polling ─────────────────────────────────────────────────── */
  const refresh = useCallback(async () => {
    if (!authToken.current) return
    try {
      const res = await fetch('/api/admin/gallery', {
        headers: { Authorization: `Bearer ${authToken.current}` },
      })
      if (res.status === 401) {
        setAuthenticated(false)
        authToken.current = ''
        return
      }
      if (res.ok) {
        const data = await res.json()
        setPhotos(data.photos ?? [])
        setLastRaffle(data.last_raffle ?? null)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!authenticated || spinning) return
    refresh()
    const id = setInterval(refresh, 4000)
    return () => clearInterval(id)
  }, [authenticated, spinning, refresh])

  /* ── Auth ─────────────────────────────────────────────────────── */
  const handleAuth = async () => {
    if (!pin.trim()) return
    setPinLoading(true)
    setPinError('')
    try {
      const res = await fetch('/api/admin/gallery', { headers: { Authorization: `Bearer ${pin}` } })
      if (res.ok) {
        authToken.current = pin
        setAuthenticated(true)
        const data = await res.json()
        setPhotos(data.photos ?? [])
        setLastRaffle(data.last_raffle ?? null)
      } else {
        setPinError('PIN incorrecto')
      }
    } catch {
      setPinError('Error de conexión')
    } finally {
      setPinLoading(false)
    }
  }

  /* ── Spin ─────────────────────────────────────────────────────── */
  const spinPhoto = async () => {
    if (photos.length === 0) return
    setSpinning(true)
    setWinner(null)
    try {
      const res = await fetch('/api/admin/gallery/spin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: spinName.trim() || 'Foto ganadora' }),
      })
      if (!res.ok) { setSpinning(false); return }
      const data = await res.json()
      const winnerPhoto = photos.find(p => p.id === data.winner_photo.id) ?? data.winner_photo
      setWinner(winnerPhoto)
      // El componente PhotoRoulette se encarga de la animación y notifica al terminar
    } catch {
      setSpinning(false)
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
            <h1 className="font-display text-3xl text-white mb-2">Galería en vivo</h1>
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Sorteo de fotos del show</p>
          </div>
          <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
            <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-3">PIN</label>
            <input
              type="password" value={pin}
              onChange={e => { setPin(e.target.value); setPinError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              placeholder="••••••••"
              autoComplete="off" autoCapitalize="off" spellCheck={false}
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
  if (spinning && winner && photos.length > 0) {
    return (
      <main className="grain min-h-screen flex items-center justify-center px-4 py-6" style={{ background: '#070508' }}>
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <p className="font-mono text-xs tracking-[0.4em] uppercase mb-3" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Sorteando foto</p>
            <h2 className="font-display text-2xl md:text-3xl text-white font-light">{spinName.trim() || 'Foto ganadora'}</h2>
          </div>
          <PhotoRoulette photos={photos} winner={winner} onComplete={onSpinComplete} />
        </div>
      </main>
    )
  }

  /* ── UI: Modo presentación ────────────────────────────────────── */
  if (presentMode && lastRaffle && lastRaffle.winner_url && lastRaffle.winner_name) {
    return (
      <main className="grain min-h-screen flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden" style={{ background: '#070508' }}>
        <Confetti />
        <div className="relative z-10 text-center w-full max-w-2xl">
          <p className="font-mono text-xs tracking-[0.5em] uppercase mb-6" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Foto ganadora</p>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <div className="mx-auto rounded-2xl overflow-hidden mb-5 inline-block"
              style={{ boxShadow: '0 0 60px rgba(139,60,247,0.6), 0 30px 60px rgba(0,0,0,0.8)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lastRaffle.winner_url} alt={lastRaffle.winner_name}
                className="block max-w-full" style={{ maxHeight: '60vh' }} />
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-white font-light mb-2"
              style={{ textShadow: '0 0 50px rgba(139,60,247,0.6)' }}>
              {lastRaffle.winner_name}
            </h1>
            <p className="font-mono text-sm text-white/40 tracking-wider">{lastRaffle.name}</p>
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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Image src="/logo-header-v2.png" alt="Pipe Santos" width={300} height={130} className="h-9 w-auto opacity-60" />
          <div className="text-right">
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Galería</p>
            <p className="font-mono text-xs" style={{ color: 'rgba(139,60,247,0.6)' }}>en vivo</p>
          </div>
        </div>

        {/* Último ganador */}
        {lastRaffle && lastRaffle.winner_url && (
          <div className="rounded-2xl p-4 mb-6 flex gap-4 items-center"
            style={{ background: 'rgba(0,200,100,0.06)', border: '1px solid rgba(0,200,100,0.3)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lastRaffle.winner_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-1">Último ganador</p>
              <p className="font-display text-lg text-white truncate">{lastRaffle.winner_name}</p>
              <p className="font-body text-white/40 text-xs truncate">{lastRaffle.name}</p>
            </div>
            <button
              onClick={() => setPresentMode(true)}
              className="font-mono text-[10px] tracking-widest uppercase flex-shrink-0"
              style={{ color: 'rgba(139,60,247,0.85)' }}
            >
              📺 Presentar
            </button>
          </div>
        )}

        {/* Contador + Sortear */}
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: 'rgba(139,60,247,0.06)', border: '1px solid rgba(139,60,247,0.25)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/40 mb-1">Total en galería</p>
              <p className="font-display text-4xl text-white font-light">{photos.length}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] tracking-widest uppercase text-white/30 mb-1">Última</p>
              <p className="font-body text-xs text-white/50">
                {photos[0] ? new Date(photos[0].created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
          </div>

          <input
            type="text"
            value={spinName}
            onChange={e => setSpinName(e.target.value)}
            placeholder="Nombre del sorteo (opcional)"
            maxLength={120}
            className="w-full rounded-xl px-4 py-2.5 font-body text-white placeholder-white/20 outline-none text-sm mb-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={spinPhoto}
            disabled={photos.length === 0}
            className="btn-primary w-full disabled:opacity-40 py-4"
            style={{ background: 'linear-gradient(135deg, #C45200, #E07820)' }}
          >
            <span className="text-base">🎰 GIRAR — sortear foto al azar</span>
          </button>
          {photos.length === 0 && (
            <p className="text-xs text-yellow-400/70 text-center mt-3 font-mono">
              ⚠ Aún no hay fotos en la galería
            </p>
          )}
        </div>

        {/* Grid de fotos */}
        {photos.length > 0 && (
          <>
            <p className="font-mono text-xs text-white/40 tracking-wider mb-3">
              Todas las fotos · más recientes primero
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map(p => (
                <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.public_url} alt={p.uploader_name}
                    className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 px-1.5 py-1"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                    <p className="font-body text-[10px] text-white/90 truncate">{p.uploader_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

/* ────────────────────────────────────────────────────────────────────
   PhotoRoulette: ruleta animada de fotos (estilo slot machine)
   ──────────────────────────────────────────────────────────────────── */

const PHOTO_FRAME_HEIGHT = 240
const PHOTO_TOTAL_FRAMES = 60

function PhotoRoulette({
  photos, winner, onComplete,
}: {
  photos: Photo[]
  winner: Photo
  onComplete: () => void
}) {
  const [showWinner, setShowWinner] = useState(false)

  const frames = useMemo(() => {
    const arr: Photo[] = []
    for (let i = 0; i < PHOTO_TOTAL_FRAMES - 1; i++) {
      arr.push(photos[Math.floor(Math.random() * photos.length)])
    }
    arr.push(winner)
    return arr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finalOffset = (PHOTO_TOTAL_FRAMES - 2) * PHOTO_FRAME_HEIGHT

  const handleComplete = () => {
    setShowWinner(true)
    setTimeout(onComplete, 5000)
  }

  return (
    <div className="relative">
      <div
        className="relative mx-auto rounded-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '560px',
          height: `${PHOTO_FRAME_HEIGHT * 3}px`,
          background: 'rgba(139,60,247,0.08)',
          border: '1px solid rgba(139,60,247,0.4)',
          boxShadow: '0 0 50px rgba(139,60,247,0.3), inset 0 0 60px rgba(0,0,0,0.5)',
        }}
      >
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: -finalOffset }}
          transition={{ duration: 6, ease: [0.13, 0.74, 0.27, 1] }}
          onAnimationComplete={handleComplete}
          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        >
          {frames.map((f, i) => (
            <div key={i}
              style={{ height: `${PHOTO_FRAME_HEIGHT}px`, padding: '8px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.public_url} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                loading="eager"
              />
            </div>
          ))}
        </motion.div>
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${PHOTO_FRAME_HEIGHT}px`,
            height: `${PHOTO_FRAME_HEIGHT}px`,
            borderTop: '2px solid rgba(139,60,247,0.6)',
            borderBottom: '2px solid rgba(139,60,247,0.6)',
            boxShadow: '0 0 40px rgba(139,60,247,0.4) inset',
          }}
        />
        <div className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ height: `${PHOTO_FRAME_HEIGHT}px`, background: 'linear-gradient(180deg, #070508 0%, transparent 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: `${PHOTO_FRAME_HEIGHT}px`, background: 'linear-gradient(0deg, #070508 0%, transparent 100%)' }} />
      </div>

      <AnimatePresence>
        {showWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mt-10 relative"
          >
            <Confetti />
            <p className="font-mono text-xs tracking-[0.4em] uppercase text-aurora/80 mb-3">📸 La foto ganadora</p>
            <h2 className="font-display text-3xl md:text-5xl text-white font-light mb-3"
              style={{ textShadow: '0 0 60px rgba(139,60,247,0.7)' }}>
              {winner.uploader_name}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Confetti CSS puro
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
        <motion.div key={p.id}
          initial={{ y: -50, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 400, opacity: 0, rotate: p.rotation + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            left: `${p.left}%`, top: 0,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, borderRadius: '2px',
          }}
        />
      ))}
    </div>
  )
}
