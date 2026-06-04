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

/* ── SEO + OG metadata ──────────────────────────────────────────────
 * Cuando compartís el link de pipesantos.com en WhatsApp/Instagram/
 * Telegram/etc, se renderiza una preview con:
 *   - Título grande
 *   - Descripción
 *   - Imagen 1200x630 (og-image-v2.jpg)
 * Usamos filename v2 para forzar el refresh del cache de WhatsApp/FB
 * (que cachean OG previews por 7+ días).                          */
const OG_TITLE = 'Pipe Santos — La vida es cule viaje'
const OG_DESCRIPTION = '22 ago 2026 · Barranquilla. Una experiencia única de storytelling con el conferencista del Caribe que conecta historias con audiencias.'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pipesantos.com'),
  title: OG_TITLE,
  description: OG_DESCRIPTION,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: 'https://www.pipesantos.com',
    siteName: 'Pipe Santos',
    type: 'website',
    locale: 'es_CO',
    images: [
      {
        url: '/og-image-v2.jpg',
        width: 1200,
        height: 630,
        alt: 'Pipe Santos — La vida es cule viaje · 22 ago 2026 · Barranquilla',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ['/og-image-v2.jpg'],
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

        {/* Preload del hero con imagesrcset → el browser preload exactamente
            la variante que va a usar (basado en viewport + DPR), sin
            descargar tamaños de más. */}
        <link
          rel="preload"
          as="image"
          type="image/webp"
          fetchPriority="high"
          media="(max-width: 767px)"
          imageSrcSet="/hero-mobile-2x.webp 2x, /hero-mobile-3x.webp 3x"
        />
        <link
          rel="preload"
          as="image"
          type="image/webp"
          fetchPriority="high"
          media="(min-width: 768px)"
          imageSrcSet="/hero-desktop-1x.webp 1x, /hero-desktop-2x.webp 2x"
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
