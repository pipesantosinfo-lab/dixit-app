import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const { data: tickets, error } = await db
    .from('tickets')
    .select(`
      *,
      ticket_tiers ( name, color ),
      events ( name )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const stats = {
    total: tickets?.length || 0,
    used: tickets?.filter(t => t.status === 'used').length || 0,
    active: tickets?.filter(t => t.status === 'active').length || 0,
  }

  return NextResponse.json({ tickets, stats })
}
