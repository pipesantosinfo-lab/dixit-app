import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

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
