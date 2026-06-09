import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { enabled } = await req.json()
  const db = supabaseAdmin()
  const body = JSON.stringify({ enabled: !!enabled })
  const blob = new Blob([body], { type: 'application/json' })
  const { error } = await db.storage.from('config').upload('sales.json', blob, { upsert: true, contentType: 'application/json' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, enabled: !!enabled })
}
