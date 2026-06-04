import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  // Solo contamos entradas CONFIRMADAS (active / used).
  // Las 'pending' (checkout en curso) y 'cancelled' no se muestran al público.
  const db = supabaseAdmin()
  const { count } = await db
    .from('lavida_tickets')
    .select('id', { count: 'exact', head: true })
    .in('status', ['active', 'used'])

  return NextResponse.json(
    { count: count ?? 0 },
    {
      headers: {
        // CDN edge cache 60s + stale-while-revalidate 5min.
        // Para 10k visitantes simultáneos: 1 sola query a Supabase por minuto
        // (en lugar de 10k). El conteo público no necesita ser real-time perfecto.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  )
}
