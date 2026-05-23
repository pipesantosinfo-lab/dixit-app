import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import TicketClient from './TicketClient'

interface Props {
  params: { ticketNumber: string }
}

export default async function TicketPage({ params }: Props) {
  // Usamos supabaseAdmin para no depender de las políticas RLS del cliente anon
  const db = supabaseAdmin()
  const { data: ticket } = await db
    .from('tickets')
    .select(`
      ticket_number,
      buyer_name,
      status,
      qr_data,
      created_at,
      ticket_tiers ( name, color, currency, price ),
      events ( name, date, location, cover_image, slug )
    `)
    .eq('ticket_number', params.ticketNumber)
    .single()

  if (!ticket) notFound()

  // buyer_email se excluye deliberadamente — no se debe serializar en el HTML del cliente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TicketClient ticket={ticket as any} />
}
