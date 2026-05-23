import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import TicketView from './TicketView'

export default async function TicketPage({ params }: { params: { number: string } }) {
  const db = supabaseAdmin()
  // Seleccionamos solo los campos necesarios — buyer_email se excluye para no
  // serializarlo en el HTML del cliente (fuga de PII)
  const { data: ticket } = await db
    .from('lavida_tickets')
    .select('ticket_number, buyer_name, status, qr_data, created_at')
    .eq('ticket_number', params.number)
    .single()

  if (!ticket || ticket.status === 'pending') notFound()

  return <TicketView ticket={ticket} />
}
