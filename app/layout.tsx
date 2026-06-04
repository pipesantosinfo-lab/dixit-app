import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import SmoothScroll from './smooth-scroll'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pipesantos.com'),
  title: 'Pipe Santos — Escritor, conferencista e influencer',
  description: 'Pipe Santos — Escritor, conferencista e influencer del Caribe colombiano.',
  openGraph: {
    title: 'Pipe Santos — Escritor, conferencista e influencer',
    description: 'Pipe Santos — Escritor, conferencista e influencer del Caribe colombiano.',
    url: 'https://www.pipesantos.com',
    siteName: 'Pipe Santos',
    type: 'website',
    locale: 'es_CO',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pipe Santos — Escritor, conferencista e influencer del Caribe colombiano',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pipe Santos — Escritor, conferencista e influencer',
    description: 'Pipe Santos — Escritor, conferencista e influencer del Caribe colombiano.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <head>
        {/* Preconnect a orígenes externos: ahorra ~100-300ms en la primera
            request a cada uno (DNS + TCP + TLS handshake hechos en paralelo
            con el HTML, en vez de en serie cuando se necesite). */}
        <link rel="preconnect" href="https://integrations.api.bold.co" />
        <link rel="preconnect" href="https://checkout.bold.co" />
        <link rel="preconnect" href="https://open.spotify.com" />

        {/* Preload del hero — empieza a descargarse en paralelo con el HTML,
            así está listo cuando el componente lo necesita. Mobile-first:
            preload solo la versión mobile (webp). En desktop, el browser
            usa el source desktop sin penalty. */}
        <link
          rel="preload"
          as="image"
          href="/hero-mobile.webp"
          type="image/webp"
          fetchPriority="high"
          media="(max-width: 767px)"
        />
        <link
          rel="preload"
          as="image"
          href="/hero-desktop.webp"
          type="image/webp"
          fetchPriority="high"
          media="(min-width: 768px)"
        />
      </head>
      <body className="bg-void text-white antialiased font-body">
        <SmoothScroll />
        {children}
        {/* Speed Insights: mide Core Web Vitals (LCP, INP, CLS) de usuarios
            reales en sus dispositivos/redes reales. Cero peso en bundle
            inicial (lazy). Dashboard en vercel.com → tu proyecto → Speed Insights. */}
        <SpeedInsights />
      </body>
    </html>
  )
}
