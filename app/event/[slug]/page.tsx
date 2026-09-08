import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import EventClient from './EventClient'

interface Props {
  params: { slug: string }
}

export default async function EventPage({ params }: Props) {
  const db = supabaseAdmin()
  const { data: event } = await db
    .from('events')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!event) notFound()

  const { data: tiers } = await db
    .from('ticket_tiers')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_active', true)
    .order('price', { ascending: true })

  return <EventClient event={event} tiers={tiers || []} />
}

export async function generateMetadata({ params }: Props) {
  const { data: event } = await supabaseAdmin()
    .from('events')
    .select('name, tagline, cover_image')
    .eq('slug', params.slug)
    .single()

  if (!event) return { title: 'Evento' }

  return {
    title: `${event.name} — Entradas`,
    description: event.tagline,
    openGraph: {
      images: [event.cover_image],
    },
  }
}
