import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import TicketView from './TicketView'

export default async function TicketPage({ params }: { params: { number: string } }) {
  const db = supabaseAdmin()
  const { data: ticket } = await db
    .from('lavida_tickets')
    .select('*')
    .eq('ticket_number', params.number)
    .single()

  if (!ticket || ticket.status === 'pending') notFound()

  return <TicketView ticket={ticket} />
}
