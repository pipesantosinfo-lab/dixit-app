import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function Home() {
  // Redirige al primer evento activo
  const { data: event } = await supabase
    .from('events')
    .select('slug')
    .eq('is_active', true)
    .single()

  if (event?.slug) {
    redirect(`/event/${event.slug}`)
  }

  // Fallback si no hay eventos
  return (
    <main className="grain min-h-screen bg-void flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-4xl text-white/20 italic">Próximamente</p>
      </div>
    </main>
  )
}
