import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TicketClient from './TicketClient'

interface Props {
  params: { ticketNumber: string }
}

export default async function TicketPage({ params }: Props) {
  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      ticket_tiers ( name, color, currency, price ),
      events ( name, date, location, cover_image, slug )
    `)
    .eq('ticket_number', params.ticketNumber)
    .single()

  if (!ticket) notFound()

  return <TicketClient ticket={ticket} />
}
