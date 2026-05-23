import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7) : null

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const { data: tickets, error } = await db
    .from('lavida_tickets')
    .select('ticket_number, buyer_name, buyer_email, buyer_cedula, buyer_phone, bold_order_id, status, payment_method, paid_at, used_at')
    .neq('status', 'cancelled')
    .order('paid_at', { ascending: false, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const all = tickets ?? []

  const stats = {
    total:   all.filter(t => t.status !== 'pending').length,
    used:    all.filter(t => t.status === 'used').length,
    pending: all.filter(t => t.status === 'active').length,
  }

  return NextResponse.json({ tickets: all, stats })
}
