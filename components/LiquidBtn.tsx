'use client'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  href?: string
  className?: string
  style?: React.CSSProperties
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

/**
 * Botón con efecto de gotas líquidas realistas al pie,
 * inspirado en pintura/slime fluyendo hacia abajo.
 */
function DripSVG() {
  return (
    <svg
      aria-hidden="true"
      className="absolute pointer-events-none select-none"
      style={{ top: '100%', left: 0, width: '100%', height: '44px', marginTop: '-2px', zIndex: 1 }}
      viewBox="0 0 300 44"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradiente horizontal que sigue el botón */}
        <linearGradient id="drip-h" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#8B3CF7" />
          <stop offset="100%" stopColor="#C45200" />
        </linearGradient>
        {/* Sheen 3D — brillo sobre cada gota */}
        <radialGradient id="drip-shine" cx="30%" cy="28%" r="55%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.38)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* Sombra interna en la base de cada gota */}
        <radialGradient id="drip-shadow" cx="50%" cy="85%" r="55%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.22)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* ── Barra base (pegada al borde inferior del botón) ── */}
      <rect x="0" y="0" width="300" height="7" fill="url(#drip-h)" />

      {/* ─── GOTA 1 — izquierda, mediana ─────────────── cx=42 */}
      <path
        fill="url(#drip-h)"
        d="M30,6 C30,6 28,14 28,20 C28,26 31,31 33,34 A9,9 0 0 0 51,34 C53,31 56,26 56,20 C56,14 54,6 54,6 Z"
      />
      <ellipse cx="36" cy="17" rx="5" ry="8"  fill="url(#drip-shine)"  />
      <ellipse cx="42" cy="32" rx="9" ry="5"  fill="url(#drip-shadow)" />

      {/* ─── GOTA 2 — corta ─────────────────────────── cx=88 */}
      <path
        fill="url(#drip-h)"
        d="M78,6 C78,6 76,12 76,17 C76,22 79,27 81,29 A7,7 0 0 0 95,29 C97,27 100,22 100,17 C100,12 98,6 98,6 Z"
      />
      <ellipse cx="83" cy="14" rx="4" ry="7"  fill="url(#drip-shine)"  />
      <ellipse cx="88" cy="27" rx="7" ry="4"  fill="url(#drip-shadow)" />

      {/* ─── GOTA 3 — la más larga, centro ─────────── cx=148 */}
      <path
        fill="url(#drip-h)"
        d="M136,6 C136,6 134,18 133,26 C132,32 135,39 138,42 A10,10 0 0 0 158,42 C161,39 164,32 163,26 C162,18 160,6 160,6 Z"
      />
      <ellipse cx="141" cy="20" rx="6" ry="10" fill="url(#drip-shine)"  />
      <ellipse cx="148" cy="40" rx="10" ry="5" fill="url(#drip-shadow)" />

      {/* ─── GOTA 4 — mediana-alta ────────────────── cx=202 */}
      <path
        fill="url(#drip-h)"
        d="M191,6 C191,6 189,15 189,22 C189,28 192,34 194,37 A8,8 0 0 0 210,37 C212,34 215,28 215,22 C215,15 213,6 213,6 Z"
      />
      <ellipse cx="196" cy="18" rx="5" ry="9"  fill="url(#drip-shine)"  />
      <ellipse cx="202" cy="35" rx="8" ry="4"  fill="url(#drip-shadow)" />

      {/* ─── GOTA 5 — corta, derecha ─────────────── cx=258 */}
      <path
        fill="url(#drip-h)"
        d="M248,6 C248,6 246,13 246,18 C246,24 249,28 251,31 A7,7 0 0 0 265,31 C267,28 270,24 270,18 C270,13 268,6 268,6 Z"
      />
      <ellipse cx="253" cy="15" rx="4" ry="7"  fill="url(#drip-shine)"  />
      <ellipse cx="258" cy="29" rx="7" ry="4"  fill="url(#drip-shadow)" />
    </svg>
  )
}

export default function LiquidBtn({ children, href, className = '', style, ...rest }: Props) {
  if (href) {
    return (
      <div className="relative inline-block">
        <a href={href} className={`btn-primary ${className}`} style={style} {...rest}>
          {children}
        </a>
        <DripSVG />
      </div>
    )
  }
  return (
    <div className="relative inline-block">
      <button className={`btn-primary ${className}`} style={style} {...rest}>
        {children}
      </button>
      <DripSVG />
    </div>
  )
}
