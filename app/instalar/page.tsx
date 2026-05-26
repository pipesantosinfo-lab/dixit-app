'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

type Platform = 'android' | 'ios' | 'desktop' | 'unknown'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  if (/mobi|tablet/.test(ua)) return 'unknown'
  return 'desktop'
}

export default function InstalarPage() {
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [tab, setTab] = useState<Platform>('android')

  useEffect(() => {
    const p = detectPlatform()
    setPlatform(p)
    if (p === 'android' || p === 'ios') setTab(p)
  }, [])

  return (
    <main className="grain min-h-screen px-5 py-8" style={{ background: '#070508' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Image src="/logo-header-v2.png" alt="Pipe Santos" width={300} height={130} className="h-12 w-auto opacity-80 mx-auto mb-6" />
          <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-3">◆ Validador de entradas</p>
          <h1 className="font-display text-3xl text-white font-light mb-3">Instala el validador</h1>
          <p className="font-body text-white/50 text-sm leading-relaxed">
            Configura tu celular antes del evento para escanear las entradas, incluso sin internet.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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

        {/* Step list */}
        {tab === 'android' && <AndroidSteps />}
        {tab === 'ios' && <IosSteps />}

        {/* Notas finales */}
        <div className="mt-8 glass rounded-2xl p-5" style={{ border: '1px solid rgba(139,60,247,0.2)' }}>
          <p className="font-mono text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(139,60,247,0.85)' }}>◆ Importante</p>
          <ul className="space-y-2 text-sm text-white/65 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-aurora">·</span>
              <span>Tu PIN te lo da Pipe Santos personalmente. <b>No lo compartas</b>.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-aurora">·</span>
              <span>El día del evento, <b>conéctate a internet antes de empezar</b> y presiona el botón <b>🔄 Sincronizar</b>.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-aurora">·</span>
              <span>Si pierdes señal durante el evento, el escáner sigue funcionando. Verás un indicador <span style={{ color: '#fbbf24' }}>amarillo</span> y un contador de entradas por subir.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-aurora">·</span>
              <span>Cuando vuelva la conexión, las entradas pendientes se suben automáticamente.</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <a
          href="/validar"
          className="mt-6 btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          <span>Abrir el validador ahora →</span>
        </a>

        {/* Detección */}
        {platform === 'desktop' && (
          <p className="mt-6 text-center text-xs font-mono text-yellow-400/70 tracking-wider">
            ⚠ Estás en un computador. Esta guía está diseñada para celulares.
          </p>
        )}
      </div>
    </main>
  )
}

/* ──────────────────────────────────────────────────────────────── */

function AndroidSteps() {
  const steps = [
    {
      n: 1,
      title: 'Abre Chrome en tu Android',
      detail: 'Si no tienes Chrome, descárgalo de la Play Store. No funciona igual de bien en otros navegadores.',
    },
    {
      n: 2,
      title: 'Ve a pipesantos.com/validar',
      detail: 'Escribe la dirección en la barra del navegador o toca el botón al final de esta página.',
    },
    {
      n: 3,
      title: 'Toca el menú ⋮ arriba a la derecha',
      detail: 'Son tres puntitos verticales en la esquina superior derecha de Chrome.',
    },
    {
      n: 4,
      title: 'Selecciona "Instalar app" o "Agregar a pantalla de inicio"',
      detail: 'Dependiendo de tu versión de Chrome aparece de una u otra forma. Si no la ves, busca "Añadir a Inicio".',
    },
    {
      n: 5,
      title: 'Confirma "Instalar"',
      detail: 'El ícono "Validador" aparecerá en tu pantalla principal como cualquier otra app.',
    },
    {
      n: 6,
      title: 'Abre el ícono "Validador" y ya estás listo',
      detail: 'Se abre en pantalla completa (sin la barra del navegador) y puedes empezar a escanear.',
    },
  ]
  return <StepList steps={steps} />
}

function IosSteps() {
  const steps = [
    {
      n: 1,
      title: 'Abre Safari en tu iPhone',
      detail: 'Tiene que ser Safari (el icono de la brújula). No funciona desde Chrome u otros navegadores en iOS.',
    },
    {
      n: 2,
      title: 'Ve a pipesantos.com/validar',
      detail: 'Escribe la dirección en la barra del navegador o toca el botón al final de esta página.',
    },
    {
      n: 3,
      title: 'Toca el botón Compartir',
      detail: 'Es el cuadrado con una flecha hacia arriba ⬆, en la barra inferior (centro).',
    },
    {
      n: 4,
      title: 'Desliza hacia abajo y toca "Añadir a inicio"',
      detail: 'Dice "Add to Home Screen" si tu iPhone está en inglés.',
    },
    {
      n: 5,
      title: 'Toca "Añadir" arriba a la derecha',
      detail: 'El ícono "Validador" aparecerá en tu pantalla de inicio.',
    },
    {
      n: 6,
      title: 'Abre el ícono "Validador" y ya estás listo',
      detail: 'Se abre como una app independiente, sin la barra de Safari.',
    },
  ]
  return <StepList steps={steps} />
}

function StepList({ steps }: { steps: Array<{ n: number; title: string; detail: string }> }) {
  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <div
          key={s.n}
          className="glass rounded-2xl p-4 flex gap-4"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display text-base font-medium"
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
  )
}
