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
 * Envuelve cualquier btn-primary y le agrega un efecto de gotas líquidas
 * usando un SVG posicionado justo debajo del botón.
 */
export default function LiquidBtn({ children, href, className = '', style, ...rest }: Props) {
  const inner = (
    <>
      {children}
    </>
  )

  const drip = (
    <svg
      aria-hidden="true"
      className="absolute pointer-events-none select-none"
      style={{ top: '100%', left: 0, width: '100%', marginTop: '-1px', zIndex: 1 }}
      viewBox="0 0 200 30"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 4 gotas de distinta altura - color brand purple/orange */}
      <path
        fill="url(#lb-grad)"
        fillOpacity="0.92"
        d="M0,0 H200 V5
          L190,5
          Q186,5 184,8 Q182,13 180,19 Q178,24 176,26 Q174,28 172,26 Q170,24 168,19 Q166,13 164,8 Q162,5 156,5
          L143,5
          Q139,5 137,9 Q135,15 133,22 Q131,27 129,29 Q127,31 125,29 Q123,27 121,22 Q119,15 117,9 Q115,5 109,5
          L94,5
          Q90,5 88,7 Q86,11 85,15 Q84,18 83,19 Q82,20 81,19 Q80,18 79,15 Q78,11 76,7 Q74,5 68,5
          L53,5
          Q49,5 47,8 Q45,13 43,19 Q41,25 39,27 Q37,29 35,27 Q33,25 31,19 Q29,13 27,8 Q25,5 19,5
          L0,5 Z"
      />
      <defs>
        <linearGradient id="lb-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B3CF7" />
          <stop offset="100%" stopColor="#C45200" />
        </linearGradient>
      </defs>
    </svg>
  )

  if (href) {
    return (
      <div className="relative inline-block">
        <a href={href} className={`btn-primary ${className}`} style={style} {...rest}>
          {inner}
        </a>
        {drip}
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <button className={`btn-primary ${className}`} style={style} {...rest}>
        {inner}
      </button>
      {drip}
    </div>
  )
}
