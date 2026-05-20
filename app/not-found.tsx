import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-xs text-white/20 tracking-[0.5em] uppercase mb-6">404</p>
        <h1 className="font-display text-5xl font-light text-white/40 italic mb-8">
          Página no encontrada
        </h1>
        <Link href="/" className="btn-ghost">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
