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

  return NextResponse.json({ count: count ?? 0 })
}
