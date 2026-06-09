import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const revalidate = 0

export async function GET() {
  try {
    const db = supabaseAdmin()
    const { data, error } = await db.storage.from('config').download('sales.json')
    if (error || !data) return NextResponse.json({ open: false })
    const text = await data.text()
    const config = JSON.parse(text)
    return NextResponse.json({ open: !!config.enabled })
  } catch {
    return NextResponse.json({ open: false })
  }
}
