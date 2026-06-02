import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireBearer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Cancela tickets 'pending' con más de PENDING_TTL_MIN minutos de antigüedad.
 * Previene que checkouts abandonados ocupen inventario permanentemente.
 *
 * Ejecutado por Vercel Cron cada 15 minutos.
 * Autorizado vía Bearer <CRON_SECRET> (timing-safe).
 */
const PENDING_TTL_MIN = 30

export async function GET(req: NextRequest) {
  const denied = requireBearer(req, process.env.CRON_SECRET)
  if (denied) return denied

  const cutoff = new Date(Date.now() - PENDING_TTL_MIN * 60_000).toISOString()
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('lavida_tickets')
    .update({ status: 'cancelled' })
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .select('ticket_number')

  if (error) {
    console.error('cleanup-pending error:', error)
    return NextResponse.json({ error: 'Error en limpieza' }, { status: 500 })
  }

  const cancelled = data?.length ?? 0
  if (cancelled > 0) {
    console.log(`🧹 Cancelados ${cancelled} pendings vencidos (> ${PENDING_TTL_MIN} min)`)
  }
  return NextResponse.json({ ok: true, cancelled })
}
