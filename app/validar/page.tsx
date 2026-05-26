'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

/* ────────────────────────────────────────────────────────────────────
   Tipos y constantes
   ──────────────────────────────────────────────────────────────────── */

type LocalTicket = {
  ticket_number: string
  buyer_name: string
  status: 'active' | 'used'
  used_at?: string | null
}

type Result = {
  valid: boolean
  buyer?: string
  message: string
  offline?: boolean
}

const STORAGE_TICKETS = 'lavida_offline_tickets'
const STORAGE_QUEUE = 'lavida_offline_used_queue'
const STORAGE_SYNC_AT = 'lavida_offline_synced_at'
const STORAGE_PIN = 'lavida_offline_pin_hash' // No guardamos el PIN — solo un hash para detectar si cambió

/* ────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function fmtRelative(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return `hace ${diffSec}s`
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)} h`
  return date.toLocaleString('es-CO')
}

/* ────────────────────────────────────────────────────────────────────
   Componente
   ──────────────────────────────────────────────────────────────────── */

export default function ValidarPage() {
  const [pin, setPin] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)

  // Modal de instrucciones de instalación
  const [showInstructions, setShowInstructions] = useState(false)

  // Estado offline-first
  const [online, setOnline] = useState(true)
  const [ticketsCount, setTicketsCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // Refs persistentes en memoria — la verdad está aquí, localStorage solo persiste
  const ticketsMap = useRef<Map<string, LocalTicket>>(new Map())
  const usedQueue = useRef<Array<{ ticket_number: string; used_at: string }>>([])
  const scannerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null)
  const authToken = useRef<string>('')
  const lastValidationRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })

  /* ── Persistencia local ──────────────────────────────────────────── */

  const saveTickets = useCallback(() => {
    try {
      const arr = Array.from(ticketsMap.current.values())
      localStorage.setItem(STORAGE_TICKETS, JSON.stringify(arr))
      setTicketsCount(arr.length)
    } catch (e) {
      console.error('No se pudo guardar tickets:', e)
    }
  }, [])

  const saveQueue = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_QUEUE, JSON.stringify(usedQueue.current))
      setPendingCount(usedQueue.current.length)
    } catch (e) {
      console.error('No se pudo guardar queue:', e)
    }
  }, [])

  /* ── Sincronización con el servidor ──────────────────────────────── */

  const syncDownTickets = useCallback(async (silent = false): Promise<boolean> => {
    if (!authToken.current) return false
    if (!silent) { setSyncing(true); setSyncMessage('Descargando entradas...') }
    try {
      const res = await fetch('/api/admin/sync-tickets', {
        headers: { Authorization: `Bearer ${authToken.current}` },
      })
      if (!res.ok) {
        if (!silent) setSyncMessage('Error: PIN inválido o sin conexión')
        return false
      }
      const data = await res.json()
      const tickets: LocalTicket[] = data.tickets ?? []
      ticketsMap.current.clear()
      for (const t of tickets) {
        ticketsMap.current.set(t.ticket_number, t)
      }
      saveTickets()
      const now = new Date()
      setLastSync(now)
      localStorage.setItem(STORAGE_SYNC_AT, now.toISOString())
      if (!silent) setSyncMessage(`✓ ${tickets.length} entradas listas para offline`)
      return true
    } catch {
      if (!silent) setSyncMessage('Sin conexión — usando datos locales')
      return false
    } finally {
      if (!silent) setTimeout(() => { setSyncing(false); setSyncMessage('') }, 2500)
    }
  }, [saveTickets])

  const syncUpQueue = useCallback(async (silent = false): Promise<boolean> => {
    if (!authToken.current) return false
    if (usedQueue.current.length === 0) return true
    if (!silent) setSyncing(true)
    try {
      const items = [...usedQueue.current]
      const res = await fetch('/api/admin/sync-used', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.current}`,
        },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        if (!silent) setSyncMessage('Sin conexión — reintentaremos automáticamente')
        return false
      }
      const data = await res.json()
      // Limpiamos el queue de los que se subieron
      const submittedNumbers = new Set(items.map(i => i.ticket_number))
      usedQueue.current = usedQueue.current.filter(i => !submittedNumbers.has(i.ticket_number))
      saveQueue()
      if (!silent) {
        if (data.conflicts?.length > 0) {
          setSyncMessage(`Sincronizado · ${data.synced} ok · ${data.conflicts.length} conflictos`)
        } else {
          setSyncMessage(`✓ ${data.synced} ${data.synced === 1 ? 'entrada' : 'entradas'} sincronizadas`)
        }
      }
      return true
    } catch {
      if (!silent) setSyncMessage('Sin conexión — reintentaremos automáticamente')
      return false
    } finally {
      if (!silent) setTimeout(() => { setSyncing(false); setSyncMessage('') }, 2500)
    }
  }, [saveQueue])

  const fullSync = useCallback(async () => {
    setSyncing(true)
    setSyncMessage('Sincronizando...')
    const queueOk = await syncUpQueue(true)
    const downOk = await syncDownTickets(true)
    if (queueOk && downOk) {
      setSyncMessage(`✓ Sincronizado · ${ticketsMap.current.size} entradas`)
      const now = new Date()
      setLastSync(now)
      localStorage.setItem(STORAGE_SYNC_AT, now.toISOString())
    } else {
      setSyncMessage('Sin conexión — usando datos locales')
    }
    setTimeout(() => { setSyncing(false); setSyncMessage('') }, 2500)
  }, [syncDownTickets, syncUpQueue])

  /* ── Auth ─────────────────────────────────────────────────────────── */

  const handleAuth = async () => {
    if (!pin.trim()) return
    setPinLoading(true)
    setPinError('')

    // Si no hay internet, validamos contra el hash guardado
    if (!navigator.onLine) {
      const storedHash = localStorage.getItem(STORAGE_PIN)
      const inputHash = await sha256(pin)
      if (storedHash && storedHash === inputHash) {
        authToken.current = pin
        setAuthenticated(true)
        setPinLoading(false)
        return
      }
      setPinError('Sin conexión y PIN no reconocido localmente')
      setPinLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/sync-tickets', {
        headers: { Authorization: `Bearer ${pin}` },
      })
      if (res.ok) {
        authToken.current = pin
        const inputHash = await sha256(pin)
        localStorage.setItem(STORAGE_PIN, inputHash)
        // Cargar tickets descargados
        const data = await res.json()
        const tickets: LocalTicket[] = data.tickets ?? []
        ticketsMap.current.clear()
        for (const t of tickets) ticketsMap.current.set(t.ticket_number, t)
        saveTickets()
        const now = new Date()
        setLastSync(now)
        localStorage.setItem(STORAGE_SYNC_AT, now.toISOString())
        setAuthenticated(true)
      } else {
        setPinError('PIN incorrecto')
      }
    } catch {
      setPinError('Error de conexión. Intenta de nuevo.')
    } finally {
      setPinLoading(false)
    }
  }

  /* ── Validación (offline-first) ──────────────────────────────────── */

  const validate = useCallback(async (code: string) => {
    const ticketNumber = code.includes('/') ? (code.split('/').pop() ?? '') : code
    if (!ticketNumber) return

    // Anti-doble-scan: si justo escaneamos lo mismo en los últimos 1.5s, ignorar
    const now = Date.now()
    if (lastValidationRef.current.code === ticketNumber && now - lastValidationRef.current.at < 1500) {
      return
    }
    lastValidationRef.current = { code: ticketNumber, at: now }

    setLoading(true)
    setResult(null)

    const ticket = ticketsMap.current.get(ticketNumber)
    const isOffline = !navigator.onLine

    if (ticket) {
      // Modo offline-first
      if (ticket.status === 'used') {
        setResult({
          valid: false,
          message: 'Entrada ya utilizada ⚠️',
          buyer: ticket.buyer_name,
          offline: isOffline,
        })
      } else {
        // Marcar como usada localmente
        const usedAt = new Date().toISOString()
        ticket.status = 'used'
        ticket.used_at = usedAt
        ticketsMap.current.set(ticketNumber, ticket)
        saveTickets()
        usedQueue.current.push({ ticket_number: ticketNumber, used_at: usedAt })
        saveQueue()

        setResult({
          valid: true,
          message: '✓ Entrada válida',
          buyer: ticket.buyer_name,
          offline: isOffline,
        })

        // Sync en background si hay internet
        if (!isOffline) {
          syncUpQueue(true).catch(() => {})
        }
      }
      setLoading(false)
      return
    }

    // No está en el cache local: si hay internet, intentar contra el servidor
    if (!isOffline) {
      try {
        const res = await fetch('/api/validate-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken.current}`,
          },
          body: JSON.stringify({ ticketNumber }),
        })
        if (res.status === 401) {
          setAuthenticated(false)
          authToken.current = ''
          setLoading(false)
          return
        }
        const data = await res.json()
        setResult(data)

        // Si era válida, actualizar cache local
        if (data.valid) {
          ticketsMap.current.set(ticketNumber, {
            ticket_number: ticketNumber,
            buyer_name: data.buyer ?? '',
            status: 'used',
            used_at: new Date().toISOString(),
          })
          saveTickets()
        }
      } catch {
        setResult({ valid: false, message: 'Sin conexión y entrada no encontrada localmente', offline: true })
      } finally {
        setLoading(false)
      }
    } else {
      setResult({
        valid: false,
        message: 'Sin conexión y entrada no encontrada localmente',
        offline: true,
      })
      setLoading(false)
    }
  }, [saveTickets, saveQueue, syncUpQueue])

  /* ── Escáner ──────────────────────────────────────────────────────── */

  const startScanner = async () => {
    if (!scannerRef.current) return
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrRef.current = new Html5Qrcode('qr-scanner')
    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          validate(decodedText)
        },
        () => {}
      )
      setScanning(true)
    } catch (err) {
      console.error(err)
      alert('No se pudo acceder a la cámara. Usa el código manual.')
    }
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop() } catch {}
    }
    setScanning(false)
  }

  /* ── Mount: registrar SW, restaurar cache, listeners online/offline ── */

  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW reg failed:', err))
    }

    // Restaurar cache local
    try {
      const cached = localStorage.getItem(STORAGE_TICKETS)
      if (cached) {
        const arr: LocalTicket[] = JSON.parse(cached)
        ticketsMap.current.clear()
        for (const t of arr) ticketsMap.current.set(t.ticket_number, t)
        setTicketsCount(arr.length)
      }
      const queue = localStorage.getItem(STORAGE_QUEUE)
      if (queue) {
        usedQueue.current = JSON.parse(queue)
        setPendingCount(usedQueue.current.length)
      }
      const syncedAtIso = localStorage.getItem(STORAGE_SYNC_AT)
      if (syncedAtIso) setLastSync(new Date(syncedAtIso))
    } catch (e) {
      console.error('No se pudo restaurar cache:', e)
    }

    // Online/offline
    const updateOnline = () => setOnline(navigator.onLine)
    updateOnline()
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
      if (html5QrRef.current) { try { html5QrRef.current.stop() } catch {} }
    }
  }, [])

  // Auto-sync cuando vuelve internet y hay queue pendiente
  useEffect(() => {
    if (online && authenticated && usedQueue.current.length > 0) {
      syncUpQueue(true).catch(() => {})
    }
  }, [online, authenticated, syncUpQueue])

  // Re-sync queue periódicamente si hay pendientes
  useEffect(() => {
    if (!authenticated) return
    const id = setInterval(() => {
      if (navigator.onLine && usedQueue.current.length > 0) {
        syncUpQueue(true).catch(() => {})
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [authenticated, syncUpQueue])

  /* ── UI ───────────────────────────────────────────────────────────── */

  if (!authenticated) {
    return (
      <main className="grain min-h-screen flex items-center justify-center px-6" style={{ background: '#070508' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/logo-header-v2.png" alt="Pipe Santos" width={300} height={130} className="h-12 w-auto opacity-80 mx-auto mb-6" />
            <h1 className="font-display text-3xl text-white mb-2">Validador</h1>
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">La vida es cule viaje · 22 ago 2026</p>
          </div>

          <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
            <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-3">PIN de acceso</label>
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
            <button
              onClick={handleAuth}
              disabled={pinLoading}
              className="btn-primary w-full"
            >
              <span>{pinLoading ? 'Verificando...' : 'Entrar'}</span>
            </button>
            {!online && (
              <p className="mt-4 text-xs text-yellow-400/80 text-center font-mono tracking-wider">
                ⚠ Sin conexión — solo se puede entrar con un PIN ya usado antes
              </p>
            )}
          </div>

          {/* Botón de instrucciones */}
          <button
            onClick={() => setShowInstructions(true)}
            className="mt-6 w-full text-center font-mono text-xs tracking-widest uppercase py-3 rounded-xl transition-colors"
            style={{
              color: 'rgba(139,60,247,0.85)',
              background: 'rgba(139,60,247,0.06)',
              border: '1px solid rgba(139,60,247,0.25)',
            }}
          >
            📱 Cómo instalar en mi celular
          </button>
        </div>

        {showInstructions && <InstallInstructionsModal onClose={() => setShowInstructions(false)} />}
      </main>
    )
  }

  return (
    <main className="grain min-h-screen px-4 py-6" style={{ background: '#070508' }}>
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Image src="/logo-header-v2.png" alt="Pipe Santos" width={300} height={130} className="h-9 w-auto opacity-60" />
          <div className="text-right">
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Validador</p>
            <p className="font-mono text-xs" style={{ color: 'rgba(139,60,247,0.6)' }}>22 ago 2026</p>
          </div>
        </div>

        {/* Barra de estado offline */}
        <div
          className="rounded-xl px-3 py-2 mb-4 flex items-center justify-between text-xs font-mono"
          style={{
            background: online
              ? 'rgba(80,200,120,0.08)'
              : 'rgba(255,180,40,0.10)',
            border: `1px solid ${online ? 'rgba(80,200,120,0.25)' : 'rgba(255,180,40,0.35)'}`,
          }}
        >
          <span className="flex items-center gap-2" style={{ color: online ? 'rgba(180,255,200,0.9)' : 'rgba(255,220,140,0.95)' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: online ? '#4ade80' : '#fbbf24',
              boxShadow: online ? '0 0 8px #4ade80' : '0 0 8px #fbbf24',
            }} />
            {online ? 'En línea' : 'Offline'}
          </span>
          <span className="text-white/50">
            {ticketsCount} cargadas
            {pendingCount > 0 && <span style={{ color: '#fbbf24' }}> · {pendingCount} por subir</span>}
          </span>
        </div>

        {/* Última sincronización + botón refrescar */}
        <div className="flex items-center justify-between mb-5 text-xs">
          <span className="text-white/40 font-mono">
            {lastSync ? `Sincronizado ${fmtRelative(lastSync)}` : 'Sin sincronizar'}
          </span>
          <button
            onClick={fullSync}
            disabled={syncing}
            className="font-mono text-xs tracking-wider uppercase disabled:opacity-40 transition-colors"
            style={{ color: 'rgba(139,60,247,0.9)' }}
          >
            {syncing ? '...' : '🔄 Sincronizar'}
          </button>
        </div>

        {syncMessage && (
          <div className="rounded-xl px-3 py-2 mb-4 text-xs font-mono text-center text-white/70"
            style={{ background: 'rgba(139,60,247,0.08)', border: '1px solid rgba(139,60,247,0.2)' }}>
            {syncMessage}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="rounded-2xl p-6 mb-6 text-center"
            style={{
              background: result.valid ? 'rgba(0,200,100,0.08)' : 'rgba(255,60,60,0.08)',
              border: `1px solid ${result.valid ? 'rgba(0,200,100,0.3)' : 'rgba(255,60,60,0.3)'}`,
            }}>
            <p className="text-5xl mb-3">{result.valid ? '✅' : '❌'}</p>
            <p className="font-display text-xl text-white mb-1">{result.message}</p>
            {result.buyer && <p className="font-body text-white/60">{result.buyer}</p>}
            {result.offline && (
              <p className="mt-2 text-[10px] tracking-widest uppercase font-mono text-yellow-400/70">
                Validado offline
              </p>
            )}
            <button onClick={() => { setResult(null); setManualCode('') }}
              className="mt-4 font-mono text-xs tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors">
              Escanear otro →
            </button>
          </div>
        )}

        {!result && (
          <>
            <div className="glass rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
              <div id="qr-scanner" ref={scannerRef} className="w-full" style={{ minHeight: scanning ? '300px' : '0' }} />
              {!scanning && (
                <div className="p-6 text-center">
                  <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-4">Escáner de cámara</p>
                  <button onClick={startScanner} className="btn-primary w-full">
                    <span>📷 Abrir cámara</span>
                  </button>
                </div>
              )}
              {scanning && (
                <div className="p-4 text-center">
                  <button onClick={stopScanner} className="btn-ghost text-sm">Detener cámara</button>
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-3">O ingresa el código manualmente</label>
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && manualCode && validate(manualCode)}
                placeholder="UUID del ticket..."
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-xl px-4 py-3 font-mono text-white text-sm placeholder-white/20 outline-none mb-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={() => validate(manualCode)}
                disabled={!manualCode || loading}
                className="btn-primary w-full disabled:opacity-40"
              >
                <span>{loading ? 'Validando...' : 'Validar entrada'}</span>
              </button>
            </div>
          </>
        )}

        {/* Botón discreto de instrucciones — siempre disponible */}
        <button
          onClick={() => setShowInstructions(true)}
          className="mt-6 w-full text-center font-mono text-xs tracking-widest uppercase py-2 transition-colors text-white/30 hover:text-white/60"
        >
          📱 Instrucciones de instalación
        </button>
      </div>

      {showInstructions && <InstallInstructionsModal onClose={() => setShowInstructions(false)} />}
    </main>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Modal: instrucciones de instalación (Android / iPhone)
   ──────────────────────────────────────────────────────────────────── */

type Platform = 'android' | 'ios'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'android'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  return 'android'
}

function InstallInstructionsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Platform>('android')

  useEffect(() => {
    setTab(detectPlatform())
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const androidSteps = [
    { n: 1, title: 'Abre Chrome en tu Android', detail: 'Si no tienes Chrome, descárgalo de la Play Store. No funciona igual de bien en otros navegadores.' },
    { n: 2, title: 'Ya estás en la página correcta', detail: 'Esta es pipesantos.com/validar — la página donde escanearás las entradas.' },
    { n: 3, title: 'Toca el menú ⋮ arriba a la derecha', detail: 'Son tres puntitos verticales en la esquina superior derecha de Chrome.' },
    { n: 4, title: 'Selecciona "Instalar app" o "Agregar a inicio"', detail: 'Dependiendo de tu versión de Chrome aparece de una u otra forma. Si no la ves, busca "Añadir a pantalla principal".' },
    { n: 5, title: 'Confirma "Instalar"', detail: 'El ícono "Validador" aparecerá en tu pantalla principal como cualquier otra app.' },
    { n: 6, title: 'Abre "Validador" y entra con tu PIN', detail: 'Se abre en pantalla completa, sin la barra del navegador. Ya estás listo para escanear.' },
  ]

  const iosSteps = [
    { n: 1, title: 'Abre Safari en tu iPhone', detail: 'Tiene que ser Safari (el icono de la brújula azul). No funciona desde Chrome u otros navegadores en iOS.' },
    { n: 2, title: 'Asegúrate de estar en pipesantos.com/validar', detail: 'Si abriste esta página desde otro navegador, vuelve a abrirla en Safari escribiendo la dirección.' },
    { n: 3, title: 'Toca el botón Compartir ⬆', detail: 'Es el cuadrado con una flecha hacia arriba en la barra inferior (centro de la pantalla).' },
    { n: 4, title: 'Desliza hacia abajo y toca "Añadir a inicio"', detail: 'Dice "Add to Home Screen" si tu iPhone está en inglés.' },
    { n: 5, title: 'Toca "Añadir" arriba a la derecha', detail: 'El ícono "Validador" aparecerá en tu pantalla de inicio.' },
    { n: 6, title: 'Abre "Validador" y entra con tu PIN', detail: 'Se abre como una app independiente, sin la barra de Safari. Ya estás listo para escanear.' },
  ]

  const steps = tab === 'android' ? androidSteps : iosSteps

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(7,5,8,0.97)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      {/* Header con título y botón cerrar */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <div>
          <p className="font-mono text-xs tracking-[0.4em] uppercase" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Instalar</p>
          <h2 className="font-display text-xl text-white font-light mt-1">Cómo instalar el validador</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto px-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="max-w-md mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['android', 'ios'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setTab(p)}
                className="flex-1 py-2.5 rounded-xl font-mono text-xs tracking-widest uppercase transition-all"
                style={{
                  background: tab === p ? 'rgba(139,60,247,0.18)' : 'transparent',
                  border: `1px solid ${tab === p ? 'rgba(139,60,247,0.5)' : 'transparent'}`,
                  color: tab === p ? 'rgba(220,195,255,0.95)' : 'rgba(255,255,255,0.45)',
                }}
              >
                {p === 'android' ? '🤖 Android' : '🍎 iPhone'}
              </button>
            ))}
          </div>

          {/* Pasos */}
          <div className="space-y-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="glass rounded-2xl p-4 flex gap-4"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display text-base"
                  style={{
                    background: 'rgba(139,60,247,0.18)',
                    border: '1px solid rgba(139,60,247,0.5)',
                    color: 'rgba(220,195,255,0.95)',
                  }}
                >
                  {s.n}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-white text-sm mb-1">{s.title}</p>
                  <p className="font-body text-white/45 text-xs leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sección Importante */}
          <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(139,60,247,0.06)', border: '1px solid rgba(139,60,247,0.2)' }}>
            <p className="font-mono text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Importante</p>
            <ul className="space-y-2 text-sm text-white/65 leading-relaxed">
              <li className="flex gap-2">
                <span style={{ color: 'rgba(139,60,247,0.7)' }}>·</span>
                <span>Tu PIN te lo da Pipe Santos personalmente. <b className="text-white/85">No lo compartas</b>.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: 'rgba(139,60,247,0.7)' }}>·</span>
                <span>El día del evento, <b className="text-white/85">conéctate a internet antes de empezar</b> y presiona el botón <b>🔄 Sincronizar</b>.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: 'rgba(139,60,247,0.7)' }}>·</span>
                <span>Si pierdes señal durante el evento, el escáner sigue funcionando. Verás un indicador <span style={{ color: '#fbbf24' }}>amarillo</span> y un contador de entradas por subir.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: 'rgba(139,60,247,0.7)' }}>·</span>
                <span>Cuando vuelva la conexión, las entradas pendientes se suben automáticamente.</span>
              </li>
            </ul>
          </div>

          {/* Botón cerrar abajo también */}
          <button
            onClick={onClose}
            className="btn-primary w-full mt-6"
          >
            <span>Listo, entendí ✓</span>
          </button>
        </div>
      </div>
    </div>
  )
}
