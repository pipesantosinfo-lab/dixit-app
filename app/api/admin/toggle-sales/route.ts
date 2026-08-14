import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { timingSafeEqual } from 'crypto'

function safeSecret(incoming: string | null): boolean {
  const expected = process.env.ADMIN_SECRET ?? ''
  if (!incoming || !expected) return false
  const a = Buffer.from(incoming, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) { timingSafeEqual(b, b); return false }
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  if (!safeSecret(req.headers.get('x-admin-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const { enabled } = body
  const db = supabaseAdmin()
  const body = JSON.stringify({ enabled: !!enabled })
  const blob = new Blob([body], { type: 'application/json' })
  const { error } = await db.storage.from('config').upload('sales.json', blob, { upsert: true, contentType: 'application/json' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, enabled: !!enabled })
}
