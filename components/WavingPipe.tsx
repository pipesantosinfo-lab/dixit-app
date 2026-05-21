'use client'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const messages = [
  '¡Hola! 👋',
  '¡Bienvenido!',
  '¡Conectemos! 🔥',
  '¡Nos vemos en Barranquilla!',
  '¡Gracias por estar aquí! ✨',
]

/* ── Caricatura SVG de Pipe Santos en posición lotus ── */
function PipeCaricature({ hover, clicked }: { hover: boolean; clicked: boolean }) {
  return (
    <svg viewBox="0 0 280 310" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        {/* Piel */}
        <radialGradient id="skin" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F2C89A" />
          <stop offset="60%" stopColor="#E0A87A" />
          <stop offset="100%" stopColor="#C8865A" />
        </radialGradient>
        {/* Piel oscura (sombras) */}
        <radialGradient id="skinDark" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#D4956A" />
          <stop offset="100%" stopColor="#A86840" />
        </radialGradient>
        {/* Camisa naranja floral */}
        <radialGradient id="shirt" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FF8C42" />
          <stop offset="50%" stopColor="#E86A20" />
          <stop offset="100%" stopColor="#C44E10" />
        </radialGradient>
        {/* Pantalón */}
        <linearGradient id="pants" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A5568" />
          <stop offset="100%" stopColor="#2D3748" />
        </linearGradient>
        {/* Cabello */}
        <radialGradient id="hair" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#3D2B1F" />
          <stop offset="100%" stopColor="#1A0A05" />
        </radialGradient>
        {/* Sombra bajo el personaje */}
        <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* Ojos */}
        <radialGradient id="eye" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#6B4226" />
          <stop offset="60%" stopColor="#2C1810" />
          <stop offset="100%" stopColor="#0A0503" />
        </radialGradient>
        {/* Glow morado */}
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(139,60,247,0.25)" />
          <stop offset="100%" stopColor="rgba(139,60,247,0)" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.4)" />
        </filter>
        <filter id="glow3d" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="rgba(139,60,247,0.5)" />
        </filter>
      </defs>

      {/* Glow de fondo */}
      <ellipse cx="140" cy="270" rx="110" ry="30" fill="url(#shadow)" />
      <ellipse cx="140" cy="155" rx="130" ry="150" fill="url(#glow)" />

      {/* ── PIERNAS EN POSICIÓN LOTUS ── */}
      {/* Pierna izquierda */}
      <motion.g animate={{ rotate: clicked ? [-2, 2, -1, 0] : 0 }} transition={{ duration: 0.4 }}>
        <ellipse cx="80" cy="268" rx="62" ry="22" fill="url(#pants)" />
        <ellipse cx="80" cy="268" rx="62" ry="22" fill="rgba(255,255,255,0.04)" />
        {/* Pie izquierdo */}
        <ellipse cx="148" cy="276" rx="22" ry="12" fill="url(#skinDark)" />
        <ellipse cx="150" cy="274" rx="18" ry="9" fill="url(#skin)" opacity="0.8" />
      </motion.g>
      {/* Pierna derecha */}
      <motion.g animate={{ rotate: clicked ? [2, -2, 1, 0] : 0 }} transition={{ duration: 0.4 }}>
        <ellipse cx="200" cy="268" rx="62" ry="22" fill="url(#pants)" />
        <ellipse cx="200" cy="268" rx="62" ry="22" fill="rgba(0,0,0,0.1)" />
        {/* Pie derecho */}
        <ellipse cx="132" cy="276" rx="22" ry="12" fill="url(#skinDark)" />
        <ellipse cx="130" cy="274" rx="18" ry="9" fill="url(#skin)" opacity="0.8" />
      </motion.g>

      {/* ── TORSO / CAMISA ── */}
      <motion.g
        animate={{ scaleY: [1, 1.015, 1, 0.985, 1] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        style={{ transformOrigin: '140px 220px' }}
      >
        {/* Cuerpo principal */}
        <path d="M82 240 Q70 220 78 190 Q90 165 140 158 Q190 165 202 190 Q210 220 198 240 Q170 258 140 260 Q110 258 82 240Z" fill="url(#shirt)" filter="url(#softShadow)" />

        {/* Patrón floral en camisa */}
        <circle cx="115" cy="195" r="5" fill="rgba(255,200,50,0.45)" />
        <circle cx="130" cy="210" r="4" fill="rgba(255,100,150,0.35)" />
        <circle cx="155" cy="192" r="5" fill="rgba(100,200,255,0.35)" />
        <circle cx="170" cy="215" r="4" fill="rgba(255,200,50,0.4)" />
        <circle cx="145" cy="228" r="3.5" fill="rgba(255,100,150,0.4)" />
        <circle cx="105" cy="220" r="3.5" fill="rgba(100,200,255,0.3)" />
        <circle cx="175" cy="198" r="3" fill="rgba(255,100,150,0.35)" />

        {/* Sombra lateral camisa */}
        <path d="M82 240 Q70 220 78 190 Q90 165 140 158" stroke="rgba(0,0,0,0.15)" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M198 240 Q210 220 202 190 Q190 165 140 158" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" strokeLinecap="round" />

        {/* Cuello */}
        <path d="M122 162 Q140 155 158 162 L155 175 Q140 168 125 175Z" fill="url(#skin)" />
      </motion.g>

      {/* ── BRAZO IZQUIERDO (saluda) ── */}
      <motion.g
        style={{ transformOrigin: '88px 195px' }}
        animate={{ rotate: clicked ? [-15, 15, -10, 10, 0] : hover ? [-8, 8, -5, 5, -3, 0] : [0, 12, -5, 12, 0] }}
        transition={clicked
          ? { duration: 0.5, ease: 'easeInOut' }
          : { repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 1 }
        }
      >
        <path d="M88 195 Q68 215 60 240 Q62 248 72 246 Q84 225 96 208Z" fill="url(#shirt)" />
        {/* Mano izquierda */}
        <ellipse cx="66" cy="248" rx="14" ry="11" fill="url(#skin)" />
        <ellipse cx="64" cy="246" rx="10" ry="8" fill="url(#skin)" opacity="0.9" />
        {/* Detalles dedos */}
        <path d="M56 242 Q60 238 66 240" stroke="#C8865A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M58 248 Q63 244 68 246" stroke="#C8865A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </motion.g>

      {/* ── BRAZO DERECHO (descansa en rodilla) ── */}
      <path d="M192 195 Q212 215 218 242 Q216 250 206 248 Q196 225 184 208Z" fill="url(#shirt)" />
      {/* Mano derecha */}
      <ellipse cx="212" cy="250" rx="14" ry="11" fill="url(#skin)" />
      <ellipse cx="210" cy="248" rx="10" ry="8" fill="url(#skin)" opacity="0.9" />

      {/* ── CABEZA ── */}
      <motion.g
        animate={{ y: clicked ? [-5, 5, -3, 0] : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Oreja izquierda */}
        <ellipse cx="83" cy="108" rx="11" ry="14" fill="url(#skinDark)" />
        <ellipse cx="85" cy="108" rx="8" ry="10" fill="url(#skin)" />
        {/* Oreja derecha */}
        <ellipse cx="197" cy="108" rx="11" ry="14" fill="url(#skinDark)" />
        <ellipse cx="195" cy="108" rx="8" ry="10" fill="url(#skin)" />

        {/* Cara principal */}
        <ellipse cx="140" cy="105" rx="58" ry="68" fill="url(#skin)" filter="url(#softShadow)" />

        {/* Sombra mandíbula */}
        <ellipse cx="140" cy="158" rx="42" ry="16" fill="url(#skinDark)" opacity="0.4" />

        {/* ── CABELLO ── */}
        {/* Base cabello */}
        <ellipse cx="140" cy="65" rx="58" ry="40" fill="url(#hair)" />
        {/* Rulos/curvas del cabello */}
        <path d="M82 80 Q75 55 90 42 Q110 28 140 30 Q170 28 190 42 Q205 55 198 80" fill="url(#hair)" />
        {/* Detalle rulos */}
        <path d="M85 72 Q88 58 98 54 Q92 66 85 72Z" fill="#4A2C1A" opacity="0.6" />
        <path d="M105 48 Q115 38 125 44 Q115 50 105 48Z" fill="#4A2C1A" opacity="0.6" />
        <path d="M140 36 Q152 30 160 38 Q150 44 140 36Z" fill="#4A2C1A" opacity="0.6" />
        <path d="M168 46 Q180 40 188 50 Q178 54 168 46Z" fill="#4A2C1A" opacity="0.6" />
        <path d="M192 68 Q198 56 194 70Z" fill="#4A2C1A" opacity="0.5" />
        {/* Brillo en cabello */}
        <path d="M108 44 Q125 36 145 38" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* ── CEJAS ── */}
        <motion.g animate={{ y: hover ? -3 : 0 }} transition={{ duration: 0.2 }}>
          <path d="M102 88 Q112 82 122 86" stroke="#2C1810" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M158 86 Q168 82 178 88" stroke="#2C1810" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </motion.g>

        {/* ── OJOS ── */}
        {/* Ojo izquierdo */}
        <motion.g
          animate={{ scaleY: [1, 1, 1, 0.1, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', times: [0, 0.7, 0.85, 0.9, 1] }}
          style={{ transformOrigin: '117px 104px' }}
        >
          <ellipse cx="117" cy="104" rx="14" ry="13" fill="white" />
          <ellipse cx="119" cy="105" rx="9" ry="10" fill="url(#eye)" />
          <ellipse cx="121" cy="103" rx="5" ry="5.5" fill="#0A0503" />
          <ellipse cx="123" cy="101" rx="2.5" ry="2.5" fill="white" opacity="0.9" />
          <ellipse cx="118" cy="107" rx="1.2" ry="1.2" fill="white" opacity="0.5" />
          {/* Párpado superior */}
          <path d="M103 100 Q117 93 131 100" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />
        </motion.g>

        {/* Ojo derecho */}
        <motion.g
          animate={{ scaleY: [1, 1, 1, 0.1, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', times: [0, 0.7, 0.85, 0.9, 1] }}
          style={{ transformOrigin: '163px 104px' }}
        >
          <ellipse cx="163" cy="104" rx="14" ry="13" fill="white" />
          <ellipse cx="161" cy="105" rx="9" ry="10" fill="url(#eye)" />
          <ellipse cx="159" cy="103" rx="5" ry="5.5" fill="#0A0503" />
          <ellipse cx="157" cy="101" rx="2.5" ry="2.5" fill="white" opacity="0.9" />
          <ellipse cx="163" cy="107" rx="1.2" ry="1.2" fill="white" opacity="0.5" />
          {/* Párpado superior */}
          <path d="M149 100 Q163 93 177 100" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />
        </motion.g>

        {/* ── NARIZ ── */}
        <path d="M135 112 Q133 125 128 130 Q136 134 140 133 Q144 134 152 130 Q147 125 145 112" fill="url(#skinDark)" opacity="0.35" />
        <ellipse cx="132" cy="129" rx="5" ry="3.5" fill="url(#skinDark)" opacity="0.5" />
        <ellipse cx="148" cy="129" rx="5" ry="3.5" fill="url(#skinDark)" opacity="0.5" />
        <path d="M132 127 Q140 132 148 127" stroke="#B87050" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* ── BOCA / SONRISA AMPLIA ── */}
        <motion.g animate={{ scaleX: hover || clicked ? 1.12 : 1 }} style={{ transformOrigin: '140px 148px' }} transition={{ duration: 0.2 }}>
          {/* Labio superior */}
          <path d="M112 143 Q125 138 140 141 Q155 138 168 143 Q162 150 140 151 Q118 150 112 143Z" fill="#C86050" />
          {/* Boca abierta sonriente */}
          <path d="M112 143 Q118 155 128 162 Q134 166 140 166 Q146 166 152 162 Q162 155 168 143 Q155 148 140 149 Q125 148 112 143Z" fill="#8B2020" />
          {/* Dientes — sonrisa amplia característica */}
          <path d="M119 147 Q140 158 161 147 Q155 155 140 157 Q125 155 119 147Z" fill="white" />
          {/* Separación dientes */}
          <path d="M140 147 L140 157" stroke="rgba(200,160,150,0.4)" strokeWidth="1" />
          <path d="M131 148 L130 156" stroke="rgba(200,160,150,0.3)" strokeWidth="0.8" />
          <path d="M149 148 L150 156" stroke="rgba(200,160,150,0.3)" strokeWidth="0.8" />
          {/* Labio inferior */}
          <path d="M118 162 Q129 170 140 171 Q151 170 162 162 Q155 166 140 167 Q125 166 118 162Z" fill="#D4756A" />
          {/* Hoyuelos */}
          <circle cx="108" cy="152" r="4" fill="url(#skinDark)" opacity="0.4" />
          <circle cx="172" cy="152" r="4" fill="url(#skinDark)" opacity="0.4" />
        </motion.g>

        {/* Mejillas sonrojadas */}
        <ellipse cx="102" cy="130" rx="16" ry="10" fill="rgba(220,100,80,0.18)" />
        <ellipse cx="178" cy="130" rx="16" ry="10" fill="rgba(220,100,80,0.18)" />

        {/* Brillo en la piel */}
        <ellipse cx="118" cy="80" rx="18" ry="12" fill="rgba(255,255,255,0.1)" transform="rotate(-15 118 80)" />
      </motion.g>

      {/* Partículas decorativas */}
      <motion.circle cx="55" cy="80" r="3" fill="rgba(139,60,247,0.6)"
        animate={{ y: [-5, 5, -5], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }} />
      <motion.circle cx="225" cy="70" r="2" fill="rgba(196,82,0,0.5)"
        animate={{ y: [5, -5, 5], opacity: [0.5, 0.9, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} />
      <motion.circle cx="240" cy="140" r="2.5" fill="rgba(139,60,247,0.4)"
        animate={{ y: [-8, 8, -8], opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} />
    </svg>
  )
}

/* ── Componente principal ── */
export default function WavingPipe() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [clicked, setClicked] = useState(false)
  const controls = useAnimationControls()

  const handleClick = async () => {
    if (clicked) return
    setClicked(true)
    setMsgIndex(i => (i + 1) % messages.length)
    await controls.start({
      y: [0, -18, 4, -8, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    })
    setClicked(false)
  }

  return (
    <motion.div
      className="relative cursor-pointer select-none flex flex-col items-center"
      onClick={handleClick}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      initial={{ opacity: 0, x: 60, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow exterior */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 55%, rgba(139,60,247,0.3) 0%, rgba(139,60,247,0.06) 55%, transparent 75%)',
        transform: 'scale(1.6)',
      }} />

      {/* Burbuja de diálogo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, y: 10, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.9 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-3 px-4 py-2 rounded-2xl text-sm font-body font-medium text-white text-center whitespace-nowrap z-20"
          style={{
            background: 'rgba(139,60,247,0.18)',
            border: '1px solid rgba(139,60,247,0.5)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(139,60,247,0.25)',
          }}
        >
          {messages[msgIndex]}
          <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
            style={{
              background: 'rgba(139,60,247,0.18)',
              borderRight: '1px solid rgba(139,60,247,0.5)',
              borderBottom: '1px solid rgba(139,60,247,0.5)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Caricatura flotante */}
      <motion.div
        className="w-44 md:w-52 relative z-10"
        animate={controls}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        >
          <PipeCaricature hover={hover} clicked={clicked} />
        </motion.div>
      </motion.div>

      {/* Texto hint */}
      <motion.p
        className="font-mono text-[9px] text-white/25 tracking-widest uppercase mt-1 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 1 }}
      >
        toca para saludar
      </motion.p>
    </motion.div>
  )
}
