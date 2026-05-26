import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Devuelve TODOS los tickets válidos (activos o ya usados) para que el
 * validador pueda funcionar offline.
 *
 * Retorna solo los campos mínimos necesarios para validar — no envía
 * correos ni cédulas para minimizar exposición de PII en el cliente.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7) : null

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('lavida_tickets')
    .select('ticket_number, buyer_name, status, used_at')
    .in('status', ['active', 'used'])

  if (error) {
    console.error('sync-tickets error:', error)
    return NextResponse.json({ error: 'Error consultando tickets' }, { status: 500 })
  }

  return NextResponse.json({
    tickets: data ?? [],
    synced_at: new Date().toISOString(),
  })
}
