import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { EVENTO } from '@/lib/evento'
import Landing from './Landing'
import './landing.css'

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.pipesantos.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: `${EVENTO.nombre} — Pipe Santos en vivo · ${EVENTO.ciudad}, ${EVENTO.fechaCorta}`,
  description: `Pipe Santos en vivo en ${EVENTO.ciudad}: ${EVENTO.fechaTexto}. ${EVENTO.lugar}. Entrada general ${EVENTO.precioTexto}. Compra aquí y recibe tu QR al correo.`,
  alternates: { canonical: `${BASE}/cartagena` },
  openGraph: {
    title: `${EVENTO.nombre} · Pipe Santos en ${EVENTO.ciudad}`,
    description: `${EVENTO.fechaTexto} · ${EVENTO.lugar} · Entrada ${EVENTO.precioTexto}`,
    url: `${BASE}/cartagena`,
    siteName: 'Pipe Santos',
    locale: 'es_CO',
    type: 'website',
    images: [{ url: `${BASE}/og-cartagena-v2.jpg`, width: 1200, height: 630, alt: `${EVENTO.nombre} — Pipe Santos` }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function CartagenaPage() {
  /* Con la landing apagada (EVENTO.landingActiva) nadie debe ver ni la
     pagina ni sus botones de compra. Se redirige a la portada en vez de
     devolver un 404: el enlace sigue vivo en la bio de Instagram y en los
     mensajes ya enviados, y es mejor que esa gente caiga en el sitio. */
  if (!EVENTO.landingActiva) redirect('/')
  return <Landing />
}
