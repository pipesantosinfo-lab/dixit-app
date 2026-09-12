import type { Metadata } from 'next'
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
    images: [{ url: `${BASE}/og-cartagena-v1.jpg`, width: 1200, height: 630, alt: `${EVENTO.nombre} — Pipe Santos` }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function CartagenaPage() {
  return <Landing />
}
