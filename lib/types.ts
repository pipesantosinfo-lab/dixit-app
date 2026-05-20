export interface Event {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  date: string
  doors_open: string
  location: string
  location_detail: string
  cover_image: string
  video_url?: string
  is_active: boolean
  created_at: string
}

export interface TicketTier {
  id: string
  event_id: string
  name: string
  description: string
  price: number        // en centavos (500 = $5.00)
  currency: string     // 'cop', 'usd', 'eur'
  total_quantity: number
  sold_quantity: number
  color: string        // color hex para UI
  is_active: boolean
}

export interface Ticket {
  id: string
  event_id: string
  tier_id: string
  ticket_number: string   // UUID único
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  stripe_payment_id: string
  qr_data: string         // URL de validación
  status: 'active' | 'used' | 'cancelled'
  used_at?: string
  created_at: string
  // joins
  event?: Event
  tier?: TicketTier
}
