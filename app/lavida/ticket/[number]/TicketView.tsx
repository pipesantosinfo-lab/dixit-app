'use client'
import Image from 'next/image'
import { useEffect, useState, useCallback, useRef, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateQRDataURL } from '@/lib/qr'
import { EVENTO } from '@/lib/evento'

interface Ticket {
  ticket_number: string
  buyer_name: string
  // buyer_email excluido deliberadamente — no se serializa en el cliente (privacidad)
  status: string
  qr_data: string
  created_at: string
}

export default function TicketView({ ticket }: { ticket: Ticket }) {
  const [qrUrl, setQrUrl] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const [showCaptureView, setShowCaptureView] = useState(false)
  // La imagen se genera UNA vez al abrir la vista previa y se guarda aqui.
  // Asi, cuando la persona toca "Compartir", navigator.share() se llama en
  // el mismo instante del toque, sin esperas: iOS lo exige y si no, rechaza.
  const [shareFile, setShareFile] = useState<File | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [escala, setEscala] = useState(1)
  const shareViewRef = useRef<HTMLDivElement>(null)
  const isUsed = ticket.status === 'used'
  const shortId = ticket.ticket_number.split('-')[0].toUpperCase()

  /* Abre la vista previa 9:16 y genera la imagen en segundo plano.
   * Antes esta misma vista se montaba solo para "fotografiarla" y se
   * desmontaba al instante — ese era el parpadeo que se veia al tocar el
   * boton. Ahora se queda abierta hasta que la persona cierra. */
  async function abrirCompartir() {
    if (sharing) return
    setSharing(true)
    setShareMsg('')
    setShareFile(null)
    // Que la tarjeta de 360x640 quepa en la pantalla junto con los botones.
    // 200 px reservados para los botones, el mensaje y la barra del navegador
    // del celular, que en Safari ocupa buena parte de la pantalla.
    setEscala(Math.min(1, (window.innerHeight - 200) / 640, (window.innerWidth - 32) / 360))
    setShowCaptureView(true)
    setPreparing(true)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    if (shareViewRef.current) {
      const imgs = Array.from(shareViewRef.current.querySelectorAll('img'))
      await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve()
        return new Promise<void>(resolve => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          setTimeout(resolve, 3000)
        })
      }))
    }
    await new Promise(r => setTimeout(r, 400))
    try {
      if (!shareViewRef.current) throw new Error('sin vista')

      /* Safari en iPhone no espera a que carguen las imagenes dentro de la
       * captura: la foto del teatro salia en blanco. Se convierten a datos
       * incrustados ANTES de capturar, asi no hay nada que descargar. */
      const imagenes = Array.from(shareViewRef.current.querySelectorAll('img'))
      await Promise.all(imagenes.map(async img => {
        if (img.src.startsWith('data:')) return
        try {
          const resp = await fetch(img.src, { cache: 'force-cache' })
          const b = await resp.blob()
          const dataUrl = await new Promise<string>((res, rej) => {
            const fr = new FileReader()
            fr.onload = () => res(fr.result as string)
            fr.onerror = rej
            fr.readAsDataURL(b)
          })
          await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); img.src = dataUrl })
        } catch { /* si falla, se captura con la url normal */ }
      }))

      const { toBlob } = await import('html-to-image')
      const opciones = {
        pixelRatio: 3, // 360 x 3 = 1080 (ancho de stories) · 640 x 3 = 1920 (alto)
        backgroundColor: '#070508',
        cacheBust: false,
        width: 360,
        height: 640,
      }
      // Render de calentamiento: en Safari el primer intento suele salir sin
      // fuentes o sin imagenes; el segundo ya lo tiene todo.
      await toBlob(shareViewRef.current, opciones).catch(() => null)
      const blob = await toBlob(shareViewRef.current, opciones)
      if (!blob) throw new Error('No se pudo generar la imagen')
      setShareFile(new File([blob], `entrada-pipesantos-${shortId}.png`, { type: 'image/png' }))
    } catch {
      setShareMsg('No se pudo generar la imagen. Toma una captura de pantalla.')
    } finally {
      setPreparing(false)
      setSharing(false)
    }
  }

  function cerrarCompartir() {
    setShowCaptureView(false)
    setShareFile(null)
    setShareMsg('')
  }

  /* Se llama directamente desde el toque del boton, sin ningun await antes
   * de navigator.share: es la unica forma en que iOS abre la hoja de
   * compartir con un archivo. */
  function compartirAhora() {
    if (!shareFile) return
    const datos = {
      files: [shareFile],
      title: '¡Voy a ver a Pipe Santos!',
      text: `¡Ya tengo mi entrada para ${EVENTO.nombre}! ${EVENTO.fechaCorta} · ${EVENTO.ciudad} ⚡🧡`,
    }
    if (!(navigator.canShare && navigator.canShare(datos))) {
      guardarImagen()
      return
    }
    navigator.share(datos)
      .then(() => setShareMsg('✓ ¡Listo!'))
      .catch((err: { name?: string }) => {
        if (err?.name !== 'AbortError') setShareMsg('No se pudo abrir el menú de compartir. Prueba "Guardar imagen".')
      })
  }

  function guardarImagen() {
    if (!shareFile) return
    const url = URL.createObjectURL(shareFile)
    const a = document.createElement('a')
    a.href = url
    a.download = shareFile.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    setShareMsg('✓ Imagen guardada · súbela a tu historia de Instagram')
  }

  /* Solo hay boton "Compartir" donde el navegador sabe compartir archivos
   * (casi todos los celulares). En computador se ofrece "Guardar imagen". */
  const puedeCompartir = typeof navigator !== 'undefined' && !!navigator.canShare
    && !!shareFile && navigator.canShare({ files: [shareFile] })

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

      {/* Poster oficial + entrada. En computador van lado a lado; en el
          celular el poster queda arriba, inclinado, y la entrada se le
          monta encima como un boleto apoyado sobre el afiche. */}
      <div className="relative z-10 w-full max-w-sm md:max-w-4xl md:flex md:items-center md:justify-center md:gap-12">

        <div className="poster-oficial md:flex-shrink-0" style={{ zIndex: 1 }}>
          <div className="poster-oficial-marco">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EVENTO.flyer} alt={`Poster oficial — ${EVENTO.nombre}`} draggable={false} />
            <div className="poster-oficial-sello">
              <span>◆ Entrada confirmada</span>
            </div>
          </div>
        </div>

      <div className="relative z-10 w-full max-w-sm md:flex-shrink-0">
        {isUsed && (
          <div className="mb-4 rounded-xl px-4 py-3 text-center font-mono text-xs tracking-widest uppercase"
            style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: 'rgba(255,100,100,0.8)' }}>
            ✗ Entrada ya utilizada
          </div>
        )}

        {/* Wrapper para que la estela superior no quede clipeada */}
        <div className="relative">
          {/* Estela superior — sólo alrededor del diseño del ticket */}
          <div className="ticket-top-glow" aria-hidden />

        {/* Ticket Card */}
        <div className="rounded-3xl overflow-hidden relative" style={{
          background: 'linear-gradient(145deg, #0d0a14, #140e20)',
          border: '1px solid rgba(139,60,247,0.25)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 50px rgba(139,60,247,0.08)',
          filter: isUsed ? 'grayscale(0.6) opacity(0.6)' : 'none',
          zIndex: 2,
        }}>
          {/* Art header — foto teatro de fondo */}
          <div className="relative w-full overflow-hidden" style={{ height: '148px' }}>
            <img
              src="/theater-bg.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.6, objectPosition: 'center 62%' }}
            />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, rgba(10,6,20,0.1) 0%, rgba(10,6,20,0.5) 55%, rgba(10,6,20,0.92) 100%)',
            }} />
            <div className="absolute" style={{
              top: '-20px', left: '-10px', width: '180px', height: '160px', borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(139,60,247,0.35) 0%, transparent 65%)',
              filter: 'blur(25px)',
            }} />
            <div className="absolute inset-0 flex flex-col justify-end" style={{ padding: '14px 18px' }}>
              <p className="font-mono text-[9px] tracking-[3px] uppercase mb-1" style={{ color: 'rgba(220,195,255,0.7)' }}>
                ◆ Pipe Santos · Show en vivo
              </p>
              <p className="font-display text-2xl font-light text-white" style={{ lineHeight: 1.1, letterSpacing: '-0.3px' }}>
                {EVENTO.nombre.split(' ')[0]} <em style={{ color: '#C45CFF' }}>{EVENTO.nombre.split(' ').slice(1).join(' ')}</em>
              </p>
            </div>
            <div className="absolute font-mono text-[9px] tracking-[2px] uppercase" style={{
              top: '14px', right: '14px',
              background: 'rgba(139,60,247,0.25)', border: '1px solid rgba(139,60,247,0.5)',
              borderRadius: '6px', padding: '4px 9px',
              color: 'rgba(220,195,255,0.95)',
            }}>
              Entrada general
            </div>
          </div>

          {/* Metadata row: fecha · ciudad · valor */}
          <div className="grid grid-cols-3" style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
            {[
              { label: 'Fecha', value: EVENTO.fechaCorta, hl: false },
              { label: 'Ciudad', value: EVENTO.ciudad, hl: false },
              { label: 'Valor', value: EVENTO.precioTexto, hl: true },
            ].map((item, i) => (
              <div key={i} className="py-3 px-4" style={{ borderRight: i < 2 ? '1px dashed rgba(255,255,255,0.08)' : 'none' }}>
                <p className="font-mono text-[8px] tracking-[2px] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.label}</p>
                <p className="text-xs font-medium" style={{ color: item.hl ? '#C45CFF' : 'rgba(255,255,255,0.9)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Perforated divider */}
          <div className="relative flex items-center" style={{ height: '28px', padding: '0 20px' }}>
            <div className="absolute -left-3 w-6 h-6 rounded-full" style={{ background: '#070508' }} />
            <div className="absolute -right-3 w-6 h-6 rounded-full" style={{ background: '#070508' }} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,60,247,0.25), transparent)' }} />
          </div>

          {/* QR zone — compacto, lado a lado */}
          <div className="flex items-center gap-4" style={{ padding: '20px 20px 20px' }}>
            <div className="flex-shrink-0 relative rounded-xl bg-white" style={{ padding: '10px', boxShadow: '0 0 0 1px rgba(139,60,247,0.2), 0 0 20px rgba(139,60,247,0.15)' }}>
              {/* Esquinas moradas */}
              {[
                { top: '-1px', left: '-1px', borderWidth: '2px 0 0 2px', borderRadius: '3px 0 0 0' },
                { top: '-1px', right: '-1px', borderWidth: '2px 2px 0 0', borderRadius: '0 3px 0 0' },
                { bottom: '-1px', left: '-1px', borderWidth: '0 0 2px 2px', borderRadius: '0 0 0 3px' },
                { bottom: '-1px', right: '-1px', borderWidth: '0 2px 2px 0', borderRadius: '0 0 3px 0' },
              ].map((s, i) => (
                <div key={i} className="absolute" style={{ width: '10px', height: '10px', borderColor: '#8B3CF7', borderStyle: 'solid', position: 'absolute', ...s }} />
              ))}
              {qrUrl
                ? <img src={qrUrl} alt="QR de entrada" width={100} height={100} className="block" />
                : <div className="flex items-center justify-center" style={{ width: '100px', height: '100px' }}>
                    <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#8B3CF7 transparent transparent transparent' }} />
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display mb-1" style={{ fontSize: '16px', letterSpacing: '-0.2px', color: 'white' }}>
                <span style={{ color: '#C45CFF' }}>{ticket.buyer_name.split(' ')[0]}</span>
                {ticket.buyer_name.includes(' ') && <span className="text-white"> {ticket.buyer_name.split(' ').slice(1).join(' ')}</span>}
              </p>
              <p className="text-white/45 leading-relaxed mb-3" style={{ fontSize: '12px' }}>
                ¡Ya estás dentro! Muestra este QR en la entrada del evento.
              </p>
              <p className="font-mono tracking-[2px] uppercase" style={{ fontSize: '10px', color: 'rgba(139,60,247,0.7)' }}>
                ◆ {shortId}
              </p>
            </div>
          </div>

          <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, rgba(139,60,247,0.8), rgba(196,82,0,0.5), transparent)' }} />
        </div>
        </div>{/* /wrapper con estela */}

        {/* Botón compartir en redes — fuera del card para que no salga en la captura */}
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={abrirCompartir}
            disabled={sharing || !qrUrl}
            className="social-pill disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ paddingLeft: '1.4rem', paddingRight: '1.4rem' }}
          >
            <span>Comparte con tus amigos</span>
            <svg className="social-pill-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>

        <p className="text-center font-body text-white/20 text-xs mt-6 leading-relaxed">
          Muestra este QR en la entrada · Válido para una persona
        </p>
        <p className="text-center font-mono text-xs mt-3" style={{ color: 'rgba(139,60,247,0.4)' }}>
          ◆ Guarda esta página como captura de pantalla
        </p>

        {/* Dinámicas en vivo */}
        <LiveRaffleSection ticketNumber={ticket.ticket_number} buyerName={ticket.buyer_name} />

        {/* Galería del evento */}
        <EventGallerySection ticketNumber={ticket.ticket_number} buyerName={ticket.buyer_name} />

        <div className="flex justify-center mt-6">
          <Image src="/logo.png" alt="Pipe Santos" width={80} height={30} className="opacity-20" />
        </div>
      </div>
      </div>{/* /poster + entrada */}

      {/* ── Vista previa para compartir: la tarjeta 9:16 se queda en pantalla
          con sus botones. Se cierra solo cuando la persona quiere. ── */}
      {showCaptureView && (
        <div
          onClick={cerrarCompartir}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(7,5,8,0.96)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '16px', gap: '14px',
          }}
        >
          {/* X para salir de la vista previa */}
          <button
            onClick={cerrarCompartir}
            aria-label="Cerrar"
            style={{
              position: 'absolute', top: 'max(14px, env(safe-area-inset-top))', right: '16px',
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
              color: 'white', fontSize: '22px', lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>

          {/* El envoltorio se escala para que quepa; la tarjeta de adentro
              conserva sus 360x640 reales, que es lo que se captura. */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 360 * escala, height: 640 * escala, flexShrink: 0,
              borderRadius: '14px', overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(139,60,247,0.18)',
            }}
          >
            <div style={{ transform: `scale(${escala})`, transformOrigin: 'top left', width: 360, height: 640 }}>
              <ShareView ref={shareViewRef} buyerName={ticket.buyer_name} shortId={shortId} />
            </div>
          </div>

          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {preparing ? (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'ui-monospace, monospace', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', padding: '12px 0' }}>
                Preparando imagen…
              </p>
            ) : (
              <>
                {/* Abre el menu de compartir del celular con la imagen lista:
                    la persona toca Instagram y elige Historia. Meterla en la
                    historia directamente solo lo puede hacer una app nativa;
                    una web no tiene permiso. Solo aparece donde el navegador
                    sabe compartir archivos (celulares). */}
                {puedeCompartir && (
                  <button onClick={compartirAhora} className="social-pill" style={{ paddingLeft: '1.2rem', paddingRight: '1.4rem', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    <span>Compartir en Instagram</span>
                  </button>
                )}
                {shareFile && (
                  <button onClick={guardarImagen} className="social-pill" style={{ paddingLeft: '1.4rem', paddingRight: '1.4rem' }}>
                    <span>Guardar imagen</span>
                  </button>
                )}
              </>
            )}
          </div>

          {shareMsg && (
            <p onClick={e => e.stopPropagation()} style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'ui-monospace, monospace', fontSize: '12px', textAlign: 'center', maxWidth: '320px', margin: 0 }}>
              {shareMsg}
            </p>
          )}
        </div>
      )}
    </main>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Dinámicas en vivo: banner del sorteo activo
   ──────────────────────────────────────────────────────────────────── */

type RaffleState = {
  raffle: {
    id: number
    name: string
    status: 'open' | 'closed' | 'finished'
    winner_name: string | null
    participants_count: number
  } | null
  has_joined?: boolean
  is_winner?: boolean
  ticket_used?: boolean
}

function LiveRaffleSection({ ticketNumber, buyerName }: { ticketNumber: string; buyerName: string }) {
  const [state, setState] = useState<RaffleState>({ raffle: null })
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/raffle/active?ticket=${encodeURIComponent(ticketNumber)}`)
      if (res.ok) {
        const data = await res.json()
        setState(data)
      }
    } catch {
      // Sin conexión — mantener estado actual
    }
  }, [ticketNumber])

  useEffect(() => {
    fetchState()
    const id = setInterval(fetchState, 5000)
    return () => clearInterval(id)
  }, [fetchState])

  const join = async () => {
    setJoining(true)
    setError('')
    try {
      const res = await fetch('/api/raffle/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_number: ticketNumber }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo inscribir')
      } else {
        setState(s => ({ ...s, has_joined: true, raffle: s.raffle ? { ...s.raffle, participants_count: s.raffle.participants_count + 1 } : null }))
      }
    } catch {
      setError('Sin conexión. Intenta de nuevo.')
    } finally {
      setJoining(false)
    }
  }

  // No mostrar nada si no hay sorteo activo
  if (!state.raffle) return null

  const r = state.raffle

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${r.id}-${r.status}-${state.has_joined ?? false}-${state.is_winner ?? false}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 rounded-2xl p-5"
        style={{
          background: r.status === 'finished' && state.is_winner
            ? 'linear-gradient(135deg, rgba(255,180,40,0.18), rgba(255,140,40,0.14))'
            : 'linear-gradient(135deg, rgba(139,60,247,0.14), rgba(196,82,235,0.08))',
          border: `1px solid ${r.status === 'finished' && state.is_winner ? 'rgba(255,180,40,0.5)' : 'rgba(139,60,247,0.4)'}`,
          boxShadow: r.status === 'finished' && state.is_winner
            ? '0 0 30px rgba(255,180,40,0.3)'
            : '0 0 20px rgba(139,60,247,0.2)',
        }}
      >
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase mb-2"
          style={{ color: r.status === 'finished' && state.is_winner ? 'rgba(255,210,120,0.95)' : 'rgba(200,160,255,0.9)' }}>
          ◆ Dinámicas en vivo
        </p>
        <h3 className="font-display text-xl text-white font-light mb-2">{r.name}</h3>

        {/* Estados según el flujo */}
        {r.status === 'open' && !state.ticket_used && (
          <p className="font-body text-white/55 text-sm mt-3">
            Aparecerá un botón aquí cuando tu QR sea escaneado en la entrada del evento.
          </p>
        )}

        {r.status === 'open' && state.ticket_used && !state.has_joined && (
          <>
            <p className="font-body text-white/65 text-sm mb-4">
              Toca el botón para participar. Si la ruleta cae en tu nombre, ganas. 🎰
            </p>
            <button
              onClick={join}
              disabled={joining}
              className="btn-primary w-full disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #8B3CF7, #C45CFF)' }}
            >
              <span>{joining ? 'Inscribiendo...' : '🎰 PARTICIPAR'}</span>
            </button>
            {error && <p className="text-red-400 text-xs mt-3 text-center font-mono">{error}</p>}
          </>
        )}

        {r.status === 'open' && state.has_joined && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✓</span>
              <p className="font-body text-white text-sm">¡Estás participando, <b>{buyerName.split(' ')[0]}</b>!</p>
            </div>
            <p className="font-mono text-xs text-white/40 tracking-wider">
              {r.participants_count} {r.participants_count === 1 ? 'persona' : 'personas'} compitiendo
            </p>
          </div>
        )}

        {r.status === 'closed' && state.has_joined && (
          <div className="mt-2">
            <p className="font-body text-white/75 text-sm flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >🎰</motion.span>
              La ruleta está por girar...
            </p>
          </div>
        )}

        {r.status === 'closed' && !state.has_joined && (
          <p className="font-body text-white/50 text-sm">Las inscripciones ya se cerraron.</p>
        )}

        {r.status === 'finished' && state.is_winner && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: [0.9, 1.05, 1] }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-5xl mb-2">🎉</div>
            <p className="font-display text-2xl text-white font-light mb-2">¡GANASTE!</p>
            <p className="font-body text-white/75 text-sm">
              Acércate al escenario o donde te indique Pipe para recibir tu premio.
            </p>
          </motion.div>
        )}

        {r.status === 'finished' && !state.is_winner && r.winner_name && (
          <div className="mt-2">
            <p className="font-mono text-xs tracking-widest uppercase text-white/40 mb-1">Ganó</p>
            <p className="font-body text-white text-sm">{r.winner_name}</p>
            <p className="font-body text-white/40 text-xs mt-2">¡Mejor suerte la próxima!</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Galería del evento: subir foto + ver galería colectiva
   ──────────────────────────────────────────────────────────────────── */

type GalleryPhoto = {
  id: number
  uploader_name: string
  public_url: string
  created_at: string
  short_id: string
  is_mine: boolean
}

type GalleryState = {
  photos: GalleryPhoto[]
  total: number
  my_photo?: { id: number; public_url: string } | null
  ticket_used?: boolean
}

function EventGallerySection({ ticketNumber, buyerName }: { ticketNumber: string; buyerName: string }) {
  const [state, setState] = useState<GalleryState>({ photos: [], total: 0 })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/gallery/photos?ticket=${encodeURIComponent(ticketNumber)}`)
      if (res.ok) setState(await res.json())
    } catch {}
  }, [ticketNumber])

  useEffect(() => {
    fetchState()
    const id = setInterval(fetchState, 8000)
    return () => clearInterval(id)
  }, [fetchState])

  // Comprimir cliente-side antes de subir
  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1800
        let w = img.naturalWidth, h = img.naturalHeight
        if (w > MAX || h > MAX) {
          const scale = Math.min(MAX / w, MAX / h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas no soportado'))
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('toBlob falló'))
          resolve(blob)
        }, 'image/jpeg', 0.88)
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('no se pudo leer')) }
      img.src = url
    })
  }

  async function handleFile(file: File) {
    setError('')
    setUploading(true)
    try {
      // Comprimir antes de subir (reduce ~70% del tamaño en mobile)
      const compressed = await compressImage(file).catch(() => file)
      const form = new FormData()
      form.append('photo', compressed instanceof Blob && !(compressed instanceof File)
        ? new File([compressed], 'foto.jpg', { type: 'image/jpeg' })
        : compressed)
      form.append('ticket_number', ticketNumber)

      const res = await fetch('/api/gallery/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo subir la foto')
      } else {
        fetchState()
      }
    } catch (e) {
      setError('Error subiendo la foto. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  // Mostrar la sección sólo cuando ticket está usado o ya hay fotos en la galería
  // (para no mostrarla en entradas que aún no han llegado)
  if (state.total === 0 && state.ticket_used !== true) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mt-6 rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(139,60,247,0.10), rgba(196,82,235,0.06))',
        border: '1px solid rgba(139,60,247,0.3)',
      }}
    >
      <p className="font-mono text-[10px] tracking-[0.4em] uppercase mb-2"
        style={{ color: 'rgba(200,160,255,0.9)' }}>
        ◆ Galería del evento
      </p>
      <h3 className="font-display text-xl text-white font-light mb-1">Comparte tu momento</h3>
      <p className="font-body text-white/55 text-sm mb-4">
        Sube una foto del show. En algún momento Pipe va a sortear una al azar para mostrarla en pantalla 📸
      </p>

      {/* Botón subir / cambiar foto */}
      {state.ticket_used && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = '' // reset para permitir re-subir misma imagen
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary w-full disabled:opacity-50 mb-3"
            style={{ background: 'linear-gradient(135deg, #8B3CF7, #C45CFF)' }}
          >
            <span>
              {uploading ? 'Subiendo...' : state.my_photo ? '🔄 Cambiar mi foto' : '📸 Subir foto al evento'}
            </span>
          </button>
        </>
      )}

      {error && <p className="text-red-400 text-xs mb-3 text-center font-mono">{error}</p>}

      {/* Tu foto destacada */}
      {state.my_photo && (
        <div className="mb-4 rounded-xl overflow-hidden border-2"
          style={{ borderColor: 'rgba(196,92,255,0.6)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.my_photo.public_url}
            alt="Tu foto"
            className="w-full block"
            style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
          />
          <div className="px-3 py-2 text-center" style={{ background: 'rgba(139,60,247,0.15)' }}>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'rgba(220,195,255,0.95)' }}>
              ★ Tu foto · {buyerName.split(' ')[0]}
            </p>
          </div>
        </div>
      )}

      {/* Grid colectivo */}
      {state.photos.length > 0 && (
        <>
          <p className="font-mono text-xs text-white/40 tracking-wider mb-2">
            {state.total} {state.total === 1 ? 'foto' : 'fotos'} en la galería
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {state.photos.filter(p => !p.is_mine).slice(0, 30).map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setLightboxIdx(idx)}
                className="relative aspect-square overflow-hidden rounded-md focus:outline-none group"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.public_url}
                  alt={p.uploader_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (() => {
        const photos = state.photos.filter(p => !p.is_mine)
        const photo = photos[lightboxIdx]
        if (!photo) return null
        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(7,5,8,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            onClick={() => setLightboxIdx(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(idx => idx === null ? null : (idx - 1 + photos.length) % photos.length) }}
              className="absolute left-4 md:left-10 z-10 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Anterior"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div
              className="relative mx-16 max-w-3xl"
              onClick={(e) => e.stopPropagation()}
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.public_url} alt={photo.uploader_name}
                className="block max-w-full max-h-[80vh] object-contain" />
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 text-center"
                style={{ background: 'linear-gradient(to top, rgba(7,5,8,0.95), transparent)' }}>
                <p className="font-display text-white text-lg">{photo.uploader_name}</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(idx => idx === null ? null : (idx + 1) % photos.length) }}
              className="absolute right-4 md:right-10 z-10 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Siguiente"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )
      })()}

      {/* Mensaje para tickets aún no escaneados */}
      {!state.ticket_used && state.total > 0 && (
        <p className="font-mono text-xs text-yellow-400/70 text-center mt-3">
          Podrás subir tu foto cuando tu QR sea escaneado en la entrada
        </p>
      )}
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   ShareView: Vista 9:16 optimizada para Instagram Stories
   Se renderiza off-screen y se captura con html-to-image al compartir.
   ──────────────────────────────────────────────────────────────────── */

const ShareView = forwardRef<HTMLDivElement, { buyerName: string; shortId: string }>(
  function ShareView({ buyerName, shortId }, ref) {
    const firstName = buyerName.split(' ')[0]
    const restName = buyerName.split(' ').slice(1).join(' ')
    const mono = 'ui-monospace, "SF Mono", Menlo, monospace'
    return (
      <div
        ref={ref}
        style={{
          width: '360px',
          height: '640px',
          background: '#070508',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Foto del teatro de fondo, muy tenue */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/theater-bg.jpg"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 62%', opacity: 0.28,
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(7,5,8,0.55) 0%, rgba(7,5,8,0.25) 30%, rgba(7,5,8,0.55) 60%, rgba(7,5,8,0.97) 100%)',
        }} />
        {/* Aura morada detras del poster y naranja abajo */}
        <div style={{
          position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)',
          width: '340px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139,60,247,0.55) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-6%', right: '-20%',
          width: '280px', height: '220px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,140,40,0.35) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />

        {/* Logo arriba */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-header-v2.png"
          alt="Pipe Santos"
          style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', height: '30px', width: 'auto', objectFit: 'contain' }}
        />

        {/* Poster oficial, inclinado, con sello */}
        <div style={{
          position: 'absolute', top: '66px', left: '50%',
          width: '212px',
          transform: 'translateX(-50%) rotate(-4deg)',
          borderRadius: '14px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.10), 0 0 50px rgba(139,60,247,0.35)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EVENTO.flyer} alt="" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '14px' }} />
          <div style={{
            position: 'absolute', top: '-12px', right: '-26px',
            transform: 'rotate(8deg)',
            padding: '7px 11px',
            border: '2px solid #ff9a3c', borderRadius: '8px',
            background: 'rgba(7,5,8,0.92)',
            fontFamily: mono, fontSize: '8.5px', letterSpacing: '2.5px', textTransform: 'uppercase',
            color: '#ff9a3c', fontWeight: 700, whiteSpace: 'nowrap',
            boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
          }}>◆ Confirmada</div>
        </div>

        {/* Tarjeta de confirmacion abajo */}
        <div style={{
          position: 'absolute', left: '22px', right: '22px', bottom: '46px',
          borderRadius: '18px', padding: '18px 18px 16px',
          border: '1px solid rgba(139,60,247,0.45)',
          background: 'linear-gradient(160deg, rgba(24,14,42,0.96), rgba(12,8,20,0.96))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(139,60,247,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', background: '#ff9a3c', transform: 'rotate(45deg)', display: 'inline-block' }} />
            <span style={{ fontFamily: mono, fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: '#ff9a3c' }}>Entrada confirmada</span>
          </div>
          <p style={{ margin: '0 0 2px', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '30px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.5px', color: 'white' }}>
            ¡VOY A IR!
          </p>
          <p style={{ margin: '0 0 12px', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '15px', fontStyle: 'italic', color: '#d9c4ff', lineHeight: 1.2 }}>
            {EVENTO.nombre} · {EVENTO.ciudad}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: '10px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontFamily: mono, fontSize: '7px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Asistente</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'white' }}>
                <span style={{ color: '#C45CFF' }}>{firstName}</span>{restName ? ' ' + restName : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px', fontFamily: mono, fontSize: '7px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{EVENTO.fechaCorta} · {EVENTO.horaTexto}</p>
              <p style={{ margin: 0, fontFamily: mono, fontSize: '10px', letterSpacing: '2px', color: '#ff9a3c' }}>N° {shortId.slice(0, -3)}***</p>
            </div>
          </div>
        </div>

        {/* URL */}
        <p style={{
          position: 'absolute', bottom: '18px', left: 0, right: 0, textAlign: 'center',
          fontFamily: mono, fontSize: '10px', letterSpacing: '3px', color: 'rgba(196,140,255,0.8)', margin: 0,
        }}>pipesantos.com</p>
      </div>
    )
  }
)
