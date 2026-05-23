/**
 * Genera el Excel de asistentes de "La vida es cule viaje"
 * Se usa en: bold-webhook (email automático) y /api/admin/export (descarga manual)
 */
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '@/lib/supabase'

const PAYMENT_LABELS: Record<string, string> = {
  PSE:                  'PSE',
  CREDIT_CARD:          'Tarjeta crédito',
  DEBIT_CARD:           'Tarjeta débito',
  NEQUI:                'Nequi',
  DAVIPLATA:            'Daviplata',
  BANCOLOMBIA_TRANSFER: 'Bancolombia',
  CASH:                 'Efectivo',
  Bold:                 'Bold',
}

export function labelPayment(raw: string | null): string {
  if (!raw) return '-'
  return PAYMENT_LABELS[raw] ?? raw
}

export async function generateLavidaExcel(): Promise<{ buffer: Buffer; filename: string; totalBuyers: number }> {
  const db = supabaseAdmin()

  const { data: tickets, error } = await db
    .from('lavida_tickets')
    .select('ticket_number, buyer_name, buyer_email, buyer_cedula, buyer_phone, bold_order_id, status, payment_method, paid_at')
    .in('status', ['active', 'used'])
    .order('paid_at', { ascending: true })

  if (error) throw new Error(`Supabase error: ${error.message}`)

  // Agrupar por orden para una fila por compra
  const ordersMap = new Map<string, {
    buyer_name: string
    buyer_email: string
    buyer_cedula: string | null
    buyer_phone: string | null
    payment_method: string | null
    paid_at: string | null
    quantity: number
    entradas_usadas: number
  }>()

  for (const t of tickets ?? []) {
    const key = t.bold_order_id ?? t.ticket_number
    if (!ordersMap.has(key)) {
      ordersMap.set(key, {
        buyer_name:     t.buyer_name,
        buyer_email:    t.buyer_email,
        buyer_cedula:   t.buyer_cedula   ?? null,
        buyer_phone:    t.buyer_phone    ?? null,
        payment_method: t.payment_method ?? null,
        paid_at:        t.paid_at        ?? null,
        quantity:       0,
        entradas_usadas: 0,
      })
    }
    const order = ordersMap.get(key)!
    order.quantity++
    if (t.status === 'used') order.entradas_usadas++
  }

  const rows = Array.from(ordersMap.values()).map(o => ({
    'Nombre':          o.buyer_name,
    'Correo':          o.buyer_email,
    'Cédula':          o.buyer_cedula ?? '-',
    'Teléfono':        o.buyer_phone  ?? '-',
    'Entradas':        o.quantity,
    'Ingresaron':      o.entradas_usadas,
    'Medio de pago':   labelPayment(o.payment_method),
    'Fecha de compra': o.paid_at
      ? new Date(o.paid_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
      : '-',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Ajustar anchos de columna automáticamente
  if (rows.length > 0) {
    ws['!cols'] = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key as keyof typeof r] ?? '').length)) + 2,
    }))
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Asistentes La Vida')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  const filename = `asistentes-lavida-${new Date().toISOString().slice(0, 10)}.xlsx`

  return { buffer, filename, totalBuyers: ordersMap.size }
}
