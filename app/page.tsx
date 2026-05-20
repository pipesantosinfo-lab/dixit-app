'use client'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="grain min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#070508' }}>

      {/* Fondo con glow morado */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(139,60,247,0.15) 0%, transparent 70%)',
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <Image src="/logo.png" alt="Pipe Santos" width={220} height={80} className="mb-10 opacity-90" />

        <p className="font-mono text-xs tracking-[0.5em] uppercase mb-6" style={{ color: 'rgba(196,82,0,0.8)' }}>
          ◆ Algo grande se viene ◆
        </p>

        <h1 className="font-display text-6xl md:text-8xl font-light text-white mb-6 leading-none">
          Próximamente
        </h1>

        <p className="font-body text-lg max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Estamos preparando algo especial para ti.<br />Vuelve pronto.
        </p>

        <div className="mt-12 flex gap-6">
          {[
            { label: 'Instagram', url: 'https://instagram.com/pipesantos93' },
            { label: 'TikTok', url: 'https://tiktok.com/@pipesantos93' },
          ].map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs tracking-widest uppercase transition-all duration-300"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseOver={e => (e.currentTarget.style.color = 'rgba(139,60,247,0.9)')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
