import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TarjetaCorreo, TARJETA, fuentesTarjeta } from '@/lib/tarjeta-correo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Imagen de la tarjeta que va en el correo de confirmacion (ver
 * lib/tarjeta-correo.tsx para el porque). Solo muestra el nombre del
 * asistente; nada mas de la persona. El numero de entrada es un UUID, no se
 * adivina, y es el mismo que ya lleva la pagina publica de la entrada.
 */
export async function GET(_req: Request, { params }: { params: { number: string } }) {
  const numero = params.number
  if (!/^[0-9a-f-]{36}-\d{1,3}$/i.test(numero)) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const { data: ticket } = await supabaseAdmin()
    .from('lavida_tickets')
    .select('ticket_number, buyer_name, status')
    .eq('ticket_number', numero)
    .single()
  if (!ticket || ticket.status === 'pending') return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const codigo = ticket.ticket_number.split('-')[0].toUpperCase()
  return new ImageResponse(
    <TarjetaCorreo nombre={ticket.buyer_name} codigo={codigo} />,
    {
      width: TARJETA.ancho * TARJETA.escala,
      height: TARJETA.alto * TARJETA.escala,
      fonts: fuentesTarjeta(),
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    },
  )
}
