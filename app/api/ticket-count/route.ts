import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { count } = await db
    .from('lavida_tickets')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'cancelled')
    .neq('status', 'pending')

  return NextResponse.json({ count: count ?? 0 })
}
