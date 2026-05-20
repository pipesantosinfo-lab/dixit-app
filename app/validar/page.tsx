'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Result = {
  valid: boolean
  buyer?: string
  message: string
  status?: string
}

export default function ValidarPage() {
  const [pin, setPin] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null)

  const validate = async (code: string) => {
    const ticketNumber = code.includes('/') ? code.split('/').pop() : code
    if (!ticketNumber) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/validate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber,
          adminSecret: process.env.NEXT_PUBLIC_ADMIN_SECRET || pin,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ valid: false, message: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const startScanner = async () => {
    if (!scannerRef.current) return
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrRef.current = new Html5Qrcode('qr-scanner')
    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          stopScanner()
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

  useEffect(() => () => { if (html5QrRef.current) { try { html5QrRef.current.stop() } catch {} } }, [])

  if (!authenticated) {
    return (
      <main className="grain min-h-screen flex items-center justify-center px-6" style={{ background: '#070508' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="Pipe Santos" width={100} height={38} className="opacity-60 mx-auto mb-6" />
            <h1 className="font-display text-3xl text-white mb-2">Validador</h1>
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">La vida es cule viaje · 22 ago 2026</p>
          </div>

          <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
            <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-3">PIN de acceso</label>
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError(false) }}
              onKeyDown={e => e.key === 'Enter' && (pin === (process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin123') ? setAuthenticated(true) : setPinError(true))}
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3 font-body text-white placeholder-white/20 text-lg outline-none mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${pinError ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.08)'}` }}
            />
            {pinError && <p className="text-red-400 text-sm mb-4">PIN incorrecto</p>}
            <button
              onClick={() => pin === (process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin123') ? setAuthenticated(true) : setPinError(true)}
              className="btn-primary w-full"
            >
              <span>Entrar</span>
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="grain min-h-screen px-4 py-8" style={{ background: '#070508' }}>
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Image src="/logo.png" alt="Pipe Santos" width={80} height={30} className="opacity-50" />
          <div className="text-right">
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase">Validador</p>
            <p className="font-mono text-xs" style={{ color: 'rgba(139,60,247,0.6)' }}>22 ago 2026</p>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-2xl p-6 mb-6 text-center"
            style={{
              background: result.valid ? 'rgba(0,200,100,0.08)' : 'rgba(255,60,60,0.08)',
              border: `1px solid ${result.valid ? 'rgba(0,200,100,0.3)' : 'rgba(255,60,60,0.3)'}`,
            }}>
            <p className="text-5xl mb-3">{result.valid ? '✅' : '❌'}</p>
            <p className="font-display text-xl text-white mb-1">{result.message}</p>
            {result.buyer && <p className="font-body text-white/60">{result.buyer}</p>}
            <button onClick={() => { setResult(null); setManualCode('') }}
              className="mt-4 font-mono text-xs tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors">
              Escanear otro →
            </button>
          </div>
        )}

        {!result && (
          <>
            {/* Camera scanner */}
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
                  <button onClick={stopScanner} className="btn-ghost text-sm">
                    Detener cámara
                  </button>
                </div>
              )}
            </div>

            {/* Manual input */}
            <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <label className="font-mono text-xs text-white/30 tracking-widest uppercase block mb-3">O ingresa el código manualmente</label>
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && manualCode && validate(manualCode)}
                placeholder="UUID del ticket..."
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
      </div>
    </main>
  )
}
