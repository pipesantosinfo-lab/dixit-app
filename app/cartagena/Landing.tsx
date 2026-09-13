'use client'
import { useEffect, useState } from 'react'
import { EVENTO } from '@/lib/evento'
import CompraModal from '@/components/CompraModal'

/**
 * Landing de una sola pagina para vender la entrada. Es el enlace que va en
 * la bio de Instagram y en WhatsApp: un objetivo (comprar), un boton fijo
 * abajo, cero distracciones. Usa la misma compra que la portada.
 */

const FOTOS = [
  { src: '/landing/asi-se-vive-16-v6.webp', alt: 'Una asistente haciendo un corazón con las manos' },
  { src: '/landing/asi-se-vive-15-v6.webp', alt: 'Público riéndose durante el show' },
  { src: '/landing/asi-se-vive-17-v6.webp', alt: 'Pipe Santos riéndose con un asistente' },
  { src: '/landing/asi-se-vive-02-v6.webp', alt: 'Selfie desde las sillas antes de empezar' },
  { src: '/landing/asi-se-vive-03-v6.webp', alt: 'Risas en primera fila' },
  { src: '/landing/asi-se-vive-04-v6.webp', alt: 'Una fila entera riéndose a carcajadas' },
  { src: '/landing/asi-se-vive-05-v6.webp', alt: 'Público riendo durante el show' },
  { src: '/landing/asi-se-vive-06-v6.webp', alt: 'Una asistente escuchando con atención' },
  { src: '/landing/asi-se-vive-07-v6.webp', alt: 'Amigas riéndose en el auditorio' },
  { src: '/landing/asi-se-vive-08-v6.webp', alt: 'Una pareja disfrutando el show' },
  { src: '/landing/asi-se-vive-09-v6.webp', alt: 'Risa nerviosa en el público' },
  { src: '/landing/asi-se-vive-10-v6.webp', alt: 'Pipe Santos con una asistente en el escenario' },
  { src: '/landing/asi-se-vive-12-v6.webp', alt: 'Un asistente participando con el micrófono' },
  { src: '/landing/asi-se-vive-13-v6.webp', alt: 'Todo el auditorio con las luces del celular encendidas' },
  { src: '/landing/asi-se-vive-14-v6.webp', alt: 'Selfie con Pipe Santos al final del show' },
]

const QUE_ES = [
  { n: '01', t: 'Te vas a reír. Mucho.', d: 'Las anécdotas que no caben en un reel de 30 segundos: las vergüenzas, los enredos y las metidas de pata que hoy dan risa.' },
  { n: '02', t: 'Y en algún punto, te va a tocar.', d: 'Entre carcajada y carcajada se cuelan las historias que le cambiaron la vida a Pipe. Sin sermón, sin fórmulas: solo verdad.' },
  { n: '03', t: 'Foto, firma y a seguir la tarde', d: 'Al final hay espacio para la foto, para firmar tu libro (o comprarlo ahí mismo) y para quedarte un rato con la gente.' },
]

const FAQ = [
  { q: '¿Cómo recibo mi entrada?', a: 'Al pagar te llega un correo con tu entrada y un código QR. Ese QR es lo que muestras en la puerta; puedes guardarlo como captura de pantalla.' },
  { q: 'Pagué por PSE y no me ha llegado nada', a: 'Con PSE el banco puede tardar unos minutos en confirmar. Apenas confirme, tu entrada sale sola al correo. Si pasan 15 minutos, entra a pipesantos.com/mi-entrada y te la reenviamos.' },
  { q: '¿Puedo comprar varias entradas?', a: 'Sí, hasta 10 en una sola compra. Llega un correo por cada entrada, cada una con su propio QR.' },
  { q: '¿Hay restricción de edad?', a: 'Sí: es para mayores de 18 años. Te pedirán el documento de identidad al ingresar.' },
  { q: '¿Dónde es exactamente?', a: `${EVENTO.lugar}. ${EVENTO.direccion}, ${EVENTO.ciudad}. Pregunta por Unitecnar; el auditorio queda dentro de la universidad.` },
]

export default function Landing() {
  const [abierto, setAbierto] = useState(false)
  const [ventas, setVentas] = useState<boolean | null>(null)
  const [vendidas, setVendidas] = useState(0)

  useEffect(() => {
    fetch('/api/sales-status').then(r => r.json()).then(d => setVentas(!!d.open)).catch(() => setVentas(false))
    fetch('/api/ticket-count').then(r => r.json()).then(d => setVendidas(d.count ?? 0)).catch(() => {})
  }, [])

  const agotado = vendidas >= EVENTO.aforo
  const pocas = !agotado && vendidas >= EVENTO.aforo * 0.8
  const comprar = () => setAbierto(true)

  return (
    <main className="landing">
      {/* ── Portada ─────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <picture>
          <source media="(min-width: 768px)" srcSet="/landing-hero-wide-v1.webp" />
          <img src="/landing-hero-v1.webp" alt="" className="landing-hero__img" fetchPriority="high" />
        </picture>
        <div className="landing-hero__shade" />

        {/* Fecha como sello, arriba a la derecha (como en el poster) */}
        <div className="landing-hero__fecha" aria-hidden>
          <span>{EVENTO.mes}</span>
          <strong>{EVENTO.dia}</strong>
          <small>{EVENTO.horaTexto}</small>
        </div>

        <div className="landing-hero__content">
          <p className="landing-eyebrow">Pipe Santos · Show en vivo</p>
          <h1 className="landing-title">
            <span className="landing-title__a">Historias</span>
            <span className="landing-title__b">sin libreto</span>
          </h1>
          <p className="landing-lead">
            Historias reales que no caben en un reel: contadas en vivo, sin filtro y sin libreto, más de dos horas que no vas a olvidar.
          </p>
          <p className="landing-meta">
            <span>{EVENTO.fechaCorta.toUpperCase()}</span><i>·</i><span>{EVENTO.ciudad.toUpperCase()}</span><i>·</i><span>{EVENTO.horaTexto}</span>
          </p>
          <div className="landing-hero__actions">
            <button onClick={comprar} className="landing-cta landing-cta--hero">
              <span>{agotado ? 'Lista de espera' : 'Comprar entrada'}</span>{!agotado && <b>{EVENTO.precioTexto}</b>}
            </button>
            <a href="#detalles" className="landing-link">Ver detalles ↓</a>
          </div>
        </div>
      </section>

      {/* ── Poster + fotos ───────────────────────────────────────────── */}
      <section className="landing-band landing-band--vive">
      <span className="landing-linea" aria-hidden />
      <div className="landing-section">
        <div className="landing-poster-row">
          <div className="landing-poster">
            <img src={EVENTO.flyer} alt={`Poster oficial — ${EVENTO.nombre}`} loading="lazy" />
          </div>
          <div className="landing-poster-text">
            <p className="landing-eyebrow landing-eyebrow--orange"><span className="landing-num">01</span>Así se vive</p>
            <h2 className="landing-h2">Lo que pasa cuando <em>estamos en la misma sala</em></h2>
            <p className="landing-p">Cada show ha sido distinto, y en todos pasó lo mismo: nadie quería que terminara.</p>
            <button onClick={comprar} className="landing-cta landing-cta--ghost"><span>Quiero mi entrada →</span></button>
          </div>
        </div>
        <div className="landing-strip" aria-label="Fotos de shows anteriores">
          {FOTOS.map(f => (
            <figure key={f.src}><img src={f.src} alt={f.alt} loading="lazy" /></figure>
          ))}
        </div>
      </div>
      </section>

      {/* ── De qué se trata ──────────────────────────────────────────── */}
      <section className="landing-band landing-band--trata landing-band--corte-der">
      <div className="landing-section">
        <p className="landing-eyebrow landing-eyebrow--orange"><span className="landing-num">02</span>¿De qué se trata?</p>
        <h2 className="landing-h2">Vienes a reírte. <em>Te vas pensando.</em></h2>
        <div className="landing-cards">
          {QUE_ES.map(x => (
            <article key={x.n} className="landing-card">
              <span className="landing-card__n">{x.n}</span>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
            </article>
          ))}
        </div>
      </div>
      </section>

      {/* ── Detalles ─────────────────────────────────────────────────── */}
      <section id="detalles" className="landing-band landing-band--datos landing-band--corte-izq">
      <div className="landing-section">
        <p className="landing-eyebrow landing-eyebrow--orange"><span className="landing-num">03</span>Los datos</p>
        <div className="landing-grid">
          <div><small>Dónde</small><strong>{EVENTO.lugar}</strong><span>{EVENTO.direccion}, {EVENTO.ciudad}</span></div>
          <div><small>Cuándo</small><strong>{EVENTO.fechaTexto.split(' · ')[0]}</strong><span>{EVENTO.horaTexto} · Llega con tiempo: el show empieza puntual</span></div>
          <div><small>Entrada general</small><strong className="landing-precio">{EVENTO.precioTexto}</strong><span>{pocas ? 'Últimas entradas' : 'Cupos limitados'} · Mayores de 18</span></div>
          <div><small>Cómo llega</small><strong>Correo con QR</strong><span>Al instante con tarjeta; con PSE apenas confirme tu banco</span></div>
        </div>
        <button onClick={comprar} className="landing-cta landing-cta--wide">
          <span>{agotado ? 'Lista de espera' : 'Comprar entrada'}</span>{!agotado && <b>{EVENTO.precioTexto}</b>}
        </button>
      </div>
      </section>

      {/* ── Preguntas ─────────────────────────────────────────────────── */}
      <section className="landing-band landing-band--faq">
      <span className="landing-linea" aria-hidden />
      <div className="landing-section">
        <p className="landing-eyebrow landing-eyebrow--orange"><span className="landing-num">04</span>Preguntas frecuentes</p>
        <div className="landing-faq">
          {FAQ.map(f => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      </section>

      {/* ── Cierre ───────────────────────────────────────────────────── */}
      <section className="landing-band landing-band--cierre landing-band--corte-der landing-final">
      <div className="landing-section">
        <h2 className="landing-h2 landing-h2--big">Nos vemos en <em>Cartagena</em>.</h2>
        <p className="landing-p">{EVENTO.fechaTexto} · {EVENTO.lugar}</p>
        <button onClick={comprar} className="landing-cta"><span>Comprar entrada</span><b>{EVENTO.precioTexto}</b></button>
        <footer className="landing-footer">
          <a href="https://www.pipesantos.com">pipesantos.com</a>
          <a href="/mi-entrada">Reenviar mi entrada</a>
          <a href="/privacidad">Privacidad</a>
        </footer>
      </div>
      </section>

      {/* ── Barra fija ────────────────────────────────────────────────── */}
      <div className="landing-bar">
        <div className="landing-bar__text">
          <strong>{EVENTO.nombre} · <span style={{ color: '#ff9a3c' }}>{EVENTO.precioTexto}</span></strong>
          <span>{EVENTO.fechaCorta} · {EVENTO.ciudad} · {pocas ? 'Últimas entradas' : 'Cupos limitados'}</span>
        </div>
        <button onClick={comprar} className="landing-cta landing-cta--bar"><span>{agotado ? 'Lista de espera' : 'Comprar'}</span>{!agotado && <b>{EVENTO.precioTexto}</b>}</button>
      </div>

      {abierto && (ventas === false || agotado ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(7,5,8,0.9)' }} onClick={() => setAbierto(false)}>
          <div className="max-w-sm w-full rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(145deg,#0d0a14,#140e20)', border: '1px solid rgba(139,60,247,0.3)' }} onClick={e => e.stopPropagation()}>
            <p className="landing-eyebrow landing-eyebrow--orange">◆ {agotado ? 'Agotadas' : 'Muy pronto'}</p>
            <h3 className="font-display text-2xl text-white mb-3">{agotado ? 'Se vendieron todas' : 'Las entradas abren muy pronto'}</h3>
            <p className="font-body text-white/50 text-sm leading-relaxed mb-6">
              {agotado ? 'Escríbenos a pipesantosinfo@gmail.com y te avisamos si se libera un cupo.' : 'Síguenos en Instagram: ahí avisamos el momento exacto.'}
            </p>
            <button onClick={() => setAbierto(false)} className="landing-cta landing-cta--ghost"><span>Entendido</span></button>
          </div>
        </div>
      ) : (
        <CompraModal onClose={() => setAbierto(false)} vendidas={vendidas} />
      ))}
    </main>
  )
}
