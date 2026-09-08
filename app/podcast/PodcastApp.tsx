'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export type Episodio = {
  n: number
  titulo: string
  desc: string
  fecha: string
  iso: string
  dur: string
  seg: number
  audio: string
  onda: number[]
  slug: string
  base: number
}

/* Las fotos que orbitan el título. Ángulo y radio en vez de coordenadas: así el
   anillo se recompone solo en cualquier proporción de pantalla. */
const ORBITA = [
  { src: '/gallery/IMG_0294.jpg', a: 205, r: 40, w: 176, rot: -8, velo: 0.55, dur: 30, dx: 8, dy: -12 },
  { src: '/gallery/IMG_0280-2.jpg', a: 196, r: 40, w: 148, rot: 4, velo: 0.68, dur: 26, dx: -7, dy: 9 },
  { src: '/gallery/DSC01782_1.jpg', a: 214, r: 39, w: 130, rot: -14, velo: 0.74, dur: 34, dx: 5, dy: 11 },
  { src: '/gallery/Archivo_192-2.jpg', a: 168, r: 42, w: 152, rot: 7, velo: 0.5, dur: 28, dx: -9, dy: -7 },
  { src: '/gallery/PHOTO-2026-08-03-17-31-37.jpg', a: 150, r: 44, w: 120, rot: -5, velo: 0.72, dur: 32, dx: 6, dy: 10 },
  { src: '/gallery/IMG_0271-2.jpg', a: 128, r: 40, w: 138, rot: 12, velo: 0.66, dur: 25, dx: -6, dy: -11 },
  { src: '/gallery/Archivo_206-2.jpg', a: 108, r: 46, w: 108, rot: -9, velo: 0.78, dur: 36, dx: 9, dy: 7 },
  { src: '/gallery/IMG_9667.JPG', a: 340, r: 40, w: 166, rot: 6, velo: 0.42, dur: 27, dx: -8, dy: 10 },
  { src: '/gallery/Archivo_565-4.jpg', a: 352, r: 41, w: 132, rot: -11, velo: 0.6, dur: 33, dx: 7, dy: -9 },
  { src: '/gallery/DSC01734.jpg', a: 328, r: 43, w: 118, rot: 9, velo: 0.7, dur: 29, dx: -5, dy: 12 },
  { src: '/gallery/IMG_7303.JPG', a: 22, r: 41, w: 150, rot: -6, velo: 0.5, dur: 31, dx: 8, dy: 8 },
  { src: '/gallery/Archivo_096-3.jpg', a: 44, r: 42, w: 124, rot: 10, velo: 0.68, dur: 26, dx: -7, dy: -10 },
  { src: '/gallery/IMG_6477.JPG', a: 66, r: 43, w: 112, rot: -13, velo: 0.75, dur: 35, dx: 6, dy: 9 },
  { src: '/gallery/_MG_8609.jpg', a: 88, r: 47, w: 100, rot: 5, velo: 0.8, dur: 28, dx: -9, dy: -6 },
  { src: '/gallery/Archivo_244.jpg', a: 300, r: 47, w: 122, rot: -7, velo: 0.64, dur: 30, dx: 7, dy: 11 },
]

const vistas = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M'
  // Coma decimal, y sin decimal cuando la cifra es redonda: 16,2 mil / 21 mil
  if (n >= 10_000) return String(Math.round(n / 100) / 10).replace('.', ',') + ' mil'
  if (n >= 1_000) return (n / 1000).toFixed(1).replace('.', ',') + ' mil'
  return String(n)
}

const reloj = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0))
  const m = Math.floor(t / 60)
  return `${m}:${String(t % 60).padStart(2, '0')}`
}

export default function PodcastApp({ episodios }: { episodios: Episodio[] }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const ondaRef = useRef<HTMLCanvasElement>(null)
  const [i, setI] = useState(-1)
  const [suena, setSuena] = useState(false)
  const [pos, setPos] = useState(0)
  const [total, setTotal] = useState(0)
  const [vel, setVel] = useState(1)
  const [plays, setPlays] = useState<Record<string, number>>(() => {
    const d: Record<string, number> = {}
    episodios.forEach((e) => { d[e.slug] = e.base })
    return d
  })
  const contado = useRef<Set<string>>(new Set())
  /* El corazon que sale al dar play. Guarda de que episodio es y un contador
     que cambia en cada pulsacion: al usarlo como key, React vuelve a montar
     el elemento y la animacion arranca de cero aunque se pulse seguido. */
  const [corazonEp, setCorazonEp] = useState<number | null>(null)
  const [corazonN, setCorazonN] = useState(0)
  const relojCorazon = useRef<number | null>(null)

  const actual = i >= 0 ? episodios[i] : null

  // Cifras reales al entrar; si el endpoint falla se queda el acumulado
  useEffect(() => {
    let vivo = true
    fetch('/api/podcast/plays')
      .then((r) => r.json())
      .then((d) => { if (vivo && d?.plays) setPlays((p) => ({ ...p, ...d.plays })) })
      .catch(() => {})
    return () => { vivo = false }
  }, [])

  /* Una reproducción se cuenta a los 5 segundos de escucha y una sola vez
     por episodio y visita. */
  const anotar = useCallback((ep: Episodio) => {
    if (contado.current.has(ep.slug)) return
    contado.current.add(ep.slug)
    let sesion = ''
    try {
      sesion = localStorage.getItem('pod_sesion') || ''
      if (!sesion) {
        sesion = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2))
        localStorage.setItem('pod_sesion', sesion)
      }
    } catch { sesion = String(Date.now()) + Math.random().toString(36).slice(2) }
    setPlays((p) => ({ ...p, [ep.slug]: (p[ep.slug] ?? ep.base) + 1 }))
    fetch('/api/podcast/plays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: ep.slug, seg: 5, session: sesion }),
    }).catch(() => {})
  }, [])


  const soltarCorazon = useCallback((idx: number) => {
    setCorazonEp(idx)
    setCorazonN((n) => n + 1)
    if (relojCorazon.current) window.clearTimeout(relojCorazon.current)
    relojCorazon.current = window.setTimeout(() => setCorazonEp(null), 1200)
  }, [])

  const poner = useCallback((idx: number) => {
    const a = audioRef.current
    if (!a || idx < 0 || idx >= episodios.length) return
    if (idx === i) {
      // mismo episodio: solo cuando se reanuda, no al pausar
      if (a.paused) { a.play(); soltarCorazon(idx) } else { a.pause() }
      return
    }
    setI(idx)
    a.src = episodios[idx].audio
    a.playbackRate = vel
    a.play().catch(() => {})
    soltarCorazon(idx)
  }, [episodios, i, vel, soltarCorazon])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const avance = () => {
      setPos(a.currentTime)
      setTotal(a.duration || 0)
      if (a.currentTime >= 5 && i >= 0) anotar(episodios[i])
    }
    const on = () => setSuena(true)
    const off = () => setSuena(false)
    const fin = () => { if (i < episodios.length - 1) poner(i + 1); else setSuena(false) }
    a.addEventListener('timeupdate', avance)
    a.addEventListener('loadedmetadata', avance)
    a.addEventListener('play', on)
    a.addEventListener('pause', off)
    a.addEventListener('ended', fin)
    return () => {
      a.removeEventListener('timeupdate', avance)
      a.removeEventListener('loadedmetadata', avance)
      a.removeEventListener('play', on)
      a.removeEventListener('pause', off)
      a.removeEventListener('ended', fin)
    }
  }, [i, episodios, poner, anotar])

  /* El espectro se dibuja con los picos reales del episodio: lo ya escuchado
     va en el morado de la marca y lo que falta en gris. */
  useEffect(() => {
    const cv = ondaRef.current
    if (!cv || !actual) return
    const pintar = () => {
      const ancho = cv.clientWidth
      const alto = cv.clientHeight
      const dpr = window.devicePixelRatio || 1
      cv.width = ancho * dpr
      cv.height = alto * dpr
      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, ancho, alto)
      const picos = actual.onda
      const n = picos.length
      const paso = ancho / n
      const grosor = Math.max(1.5, paso * 0.56)
      const avance = total ? pos / total : 0
      picos.forEach((p, k) => {
        const h = Math.max(2, p * alto * 0.9)
        const x = k * paso + (paso - grosor) / 2
        const y = (alto - h) / 2
        const oido = k / n <= avance
        if (oido) {
          const g = ctx.createLinearGradient(0, y, 0, y + h)
          g.addColorStop(0, '#F0D6A4')
          g.addColorStop(1, '#E3C48A')
          ctx.fillStyle = g
        } else {
          ctx.fillStyle = 'rgba(214,231,240,0.20)'
        }
        ctx.beginPath()
        ctx.roundRect(x, y, grosor, h, grosor / 2)
        ctx.fill()
      })
    }
    pintar()
    const ro = new ResizeObserver(pintar)
    ro.observe(cv)
    return () => ro.disconnect()
  }, [actual, pos, total])

  const saltar = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const a = audioRef.current
    if (!a || !total) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - r.left) / r.width) * total
  }

  const cambiarVel = () => {
    const opciones = [1, 1.25, 1.5, 1.75, 0.75]
    const v = opciones[(opciones.indexOf(vel) + 1) % opciones.length]
    setVel(v)
    if (audioRef.current) audioRef.current.playbackRate = v
  }

  const mover = (s: number) => {
    const a = audioRef.current
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + s))
  }

  /* Media Session: es lo que hace que, al salir del navegador, el telefono
     muestre la caratula, el titulo del episodio y unos controles que
     funcionan de verdad — en la pantalla de bloqueo, en la notificacion y en
     el centro de control. Sin esto solo aparece la direccion de la web. */
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    if (!actual) { ms.metadata = null; return }

    ms.metadata = new MediaMetadata({
      title: actual.titulo,
      artist: 'Pipe Santos',
      album: 'Regálate un Ratico',
      // varios tamaños: cada sistema elige el que le encaja
      artwork: [96, 128, 192, 256, 384, 512].map((t) => ({
        src: `/podcast/cover-${t}.jpg`,
        sizes: `${t}x${t}`,
        type: 'image/jpeg',
      })),
    })

    const acciones: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => { audioRef.current?.play() }],
      ['pause', () => { audioRef.current?.pause() }],
      ['seekbackward', () => mover(-15)],
      ['seekforward', () => mover(15)],
      ['previoustrack', () => { if (i > 0) poner(i - 1) }],
      ['nexttrack', () => { if (i < episodios.length - 1) poner(i + 1) }],
      ['seekto', (d) => { const a = audioRef.current; if (a && d.seekTime != null) a.currentTime = d.seekTime }],
    ]
    for (const [accion, fn] of acciones) {
      try { ms.setActionHandler(accion, fn) } catch { /* accion no soportada */ }
    }
    return () => {
      for (const [accion] of acciones) {
        try { ms.setActionHandler(accion, null) } catch { }
      }
    }
  }, [actual, i, episodios.length, poner])

  // La barra de progreso del sistema, para que se vea cuanto lleva sonando
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    ms.playbackState = suena ? 'playing' : (actual ? 'paused' : 'none')
    if (!actual || !total || !Number.isFinite(total)) return
    try {
      ms.setPositionState({ duration: total, position: Math.min(pos, total), playbackRate: vel })
    } catch { /* algunos navegadores no lo admiten */ }
  }, [suena, actual, pos, total, vel])

  return (
    <div className="pod">
      <div className="pod-grano" aria-hidden />

      <nav className="pod-bar">
        <span className="pod-dots" aria-hidden><i /><i /><i /><i /></span>
        <a href="#episodios">Episodios</a>
        <a href="/" className="pod-solid">Volver al sitio</a>
      </nav>

      {/* ── Portada ── */}
      <section className="pod-portada">
        <div className="pod-orbita" aria-hidden>
          {ORBITA.map((p, k) => {
            const rad = (p.a * Math.PI) / 180
            const x = 50 + Math.cos(rad) * p.r * 1.3
            const y = 50 + Math.sin(rad) * p.r
            const h = Math.round(p.w * 1.26)
            return (
              <div key={k} className="pod-foto" style={{
                left: `${x}%`, top: `${y}%`, width: p.w, height: h,
                marginLeft: -p.w / 2, marginTop: -h / 2,
                ['--rot' as string]: `${p.rot}deg`, ['--velo' as string]: p.velo,
                ['--dur' as string]: `${p.dur}s`, ['--dx' as string]: `${p.dx}px`,
                ['--dy' as string]: `${p.dy}px`, ['--dr' as string]: `${p.rot > 0 ? -1.8 : 1.8}deg`,
                animationDelay: `${-k * 1.7}s`,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" loading={k < 6 ? 'eager' : 'lazy'} />
              </div>
            )
          })}
        </div>
        <div className="pod-vineta" aria-hidden />

        {/* Interferencia de televisor: lineas de barrido que bajan, grano con
            tinte morado y una banda de señal que cruza cada tantos segundos.
            Todo continuo, sin golpes bruscos. Decorativo, por encima de las
            fotos y por debajo del titulo. */}
        <div className="pod-tv" aria-hidden>
          <div className="pod-tv-lineas" />
          <div className="pod-tv-banda" />
          <div className="pod-tv-ruido" />
        </div>

        <div className="pod-centro">
          <p className="pod-marca">
            <em>Un podcast de</em><i aria-hidden /><b>Pipe Santos</b>
          </p>
          <h1 className="pod-titulo">Regálate<br />un Ratico<sup aria-hidden>◆</sup></h1>
          <p className="pod-sub">Reflexiones diarias <span>a través de historias</span></p>
        </div>

        <a href="#episodios" className="pod-scroll">
          <span>Scroll para explorar</span>
          <i aria-hidden>
            <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
              <path d="M6.5 0v13M1 8l5.5 5.5L12 8" stroke="#0A0A0B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </i>
        </a>
      </section>

      {/* ── Episodios ── */}
      <section id="episodios" className="pod-eps">
        <header className="pod-cab">
          <div>
            <div className="pod-marca-eps">
              <em>Un podcast de</em><i aria-hidden /><b>Pipe Santos</b>
            </div>
            <h2>Episodios</h2>
            <p>{episodios.length} relatos sobre lo que deja la vida cuando uno se detiene a mirarla.</p>
          </div>
          <span className="pod-cuenta">{episodios.length} episodios</span>
        </header>

        <div className="pod-lista">
          {episodios.map((e) => {
            const idx = episodios.findIndex((x) => x.audio === e.audio)
            const activo = idx === i
            return (
              <article key={e.audio} className={`pod-ep${activo ? ' suena' : ''}`} onClick={() => poner(idx)}>
                {corazonEp === idx && (
                  <span key={corazonN} className="pod-corazon" aria-hidden>
                    <svg viewBox="0 0 24 24" className="pod-corazon__x">
                      <path d="M12 20.7C6.5 16.9 3 13.6 3 9.9 3 7.2 5.1 5.2 7.7 5.2c1.7 0 3.3.9 4.3 2.3 1-1.4 2.6-2.3 4.3-2.3 2.6 0 4.7 2 4.7 4.7 0 3.7-3.5 7-9 10.8z" />
                    </svg>
                    <i className="pod-corazon__mota pod-corazon__mota--a" />
                    <i className="pod-corazon__mota pod-corazon__mota--b" />
                  </span>
                )}
                <div className="pod-num">
                  {activo && suena ? (
                    <span className="pod-onda" aria-hidden>
                      <span style={{ animationDelay: '0s' }} /><span style={{ animationDelay: '.15s' }} />
                      <span style={{ animationDelay: '.3s' }} /><span style={{ animationDelay: '.45s' }} />
                    </span>
                  ) : String(e.n).padStart(2, '0')}
                </div>
                <div className="pod-texto">
                  <h3>{e.titulo}</h3>
                  <p>{e.desc}</p>
                </div>
                <div className="pod-meta">
                  <span className="pod-vistas" title={(plays[e.slug] ?? e.base).toLocaleString('es-CO') + ' reproducciones'}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    {vistas(plays[e.slug] ?? e.base)}
                  </span>
                  <span>{e.dur}</span>
                  <span className="pod-play" aria-hidden>
                    {activo && suena
                      ? <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1.5" y="1" width="3" height="10" fill="currentColor" /><rect x="7.5" y="1" width="3" height="10" fill="currentColor" /></svg>
                      : <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 1l8 5-8 5V1z" fill="currentColor" /></svg>}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── Reproductor ── */}
      <div className={`pod-player${actual ? ' abierto' : ''}`}>
        <div className="pod-fila">
          <div className="pod-cara">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/podcast/cover.jpg" alt="" />
          </div>
          <div className="pod-info">
            <h4>{actual ? actual.titulo : '—'}</h4>
            <span>{actual ? `${vistas(plays[actual.slug] ?? actual.base)} reproducciones · ${actual.dur}` : ''}</span>
          </div>
          <canvas ref={ondaRef} className="pod-espectro" onClick={saltar} />
          <span className="pod-tiempo">{reloj(pos)} / {reloj(total || (actual ? actual.seg : 0))}</span>
          <div className="pod-mandos">
            <button type="button" onClick={() => mover(-15)} title="Atrás 15s" aria-label="Retroceder 15 segundos">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5 4 12l7 7" /><path d="M20 12H4" /></svg>
            </button>
            <button type="button" className="pod-grande" onClick={() => (i < 0 ? poner(0) : poner(i))} aria-label={suena ? 'Pausar' : 'Reproducir'}>
              {suena
                ? <svg width="17" height="17" viewBox="0 0 17 17"><rect x="3.5" y="2" width="3.5" height="13" fill="currentColor" /><rect x="10" y="2" width="3.5" height="13" fill="currentColor" /></svg>
                : <svg width="17" height="17" viewBox="0 0 17 17"><path d="M4 2l11 6.5L4 15V2z" fill="currentColor" /></svg>}
            </button>
            <button type="button" onClick={() => mover(15)} title="Adelante 15s" aria-label="Avanzar 15 segundos">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m13 5 7 7-7 7" /><path d="M20 12H4" /></svg>
            </button>
            <button type="button" className="pod-vel" onClick={cambiarVel}>{vel}×</button>
          </div>
        </div>
      </div>

      <audio ref={audioRef} preload="metadata" />
    </div>
  )
}
