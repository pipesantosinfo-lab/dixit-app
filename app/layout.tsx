import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono, Space_Grotesk, Montserrat } from 'next/font/google'
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

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  weight: ['300', '400', '500'],
})

/* Titular del hero de escritorio */
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-hero',
  weight: ['800', '900'],
})

/* ── SEO + OG metadata ──────────────────────────────────────────────
 * Cuando compartís el link de pipesantos.com en WhatsApp/Instagram/
 * Telegram/etc, se renderiza una preview con:
 *   - Título grande
 *   - Descripción
 *   - Imagen 1200x630 (og-pipe-santos.jpg)
 * El texto es permanente a proposito: antes anunciaba la fecha de un evento
 * concreto y quedaba desactualizado en cuanto pasaba. WhatsApp y Facebook
 * guardan estas vistas previas una semana o mas, asi que conviene que no
 * caduquen solas.                                                    */
const OG_TITLE = 'Pipe Santos — La vida es cule viaje'
const OG_DESCRIPTION = 'Conferencista, escritor e influencer. Historias que conectan.'

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
        // El logo de la cabecera sobre el fondo de la marca. La anterior
        // anunciaba el evento del 22 de agosto, que ya paso.
        url: '/og-pipe-santos.jpg',
        width: 1200,
        height: 630,
        alt: 'Pipe Santos',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ['/og-pipe-santos.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} ${spaceGrotesk.variable} ${montserrat.variable}`}>
      <head>
        {/* Preconnect a orígenes externos: ahorra ~100-300ms en la primera
            request a cada uno (DNS + TCP + TLS handshake hechos en paralelo
            con el HTML, en vez de en serie cuando se necesite). */}
        <link rel="preconnect" href="https://integrations.api.bold.co" />
        <link rel="preconnect" href="https://checkout.bold.co" />
        <link rel="preconnect" href="https://open.spotify.com" />

        {/* Preload del hero con imagesrcset → el browser descarga desde el
            primer momento, y con la prioridad más alta, exactamente la
            variante que va a pintar (según viewport y densidad de pantalla).

            Ojo con mantener estas rutas al día: apuntaban a las versiones
            viejas del hero, así que todo el mundo se bajaba con prioridad
            alta una foto que ya no se muestra (342KB de más en escritorio).
            El hero de escritorio ya no lleva foto de fondo — son las cinco
            tarjetas — así que ahí lo que conviene adelantar es la primera. */}
        <link
          rel="preload"
          as="image"
          type="image/webp"
          fetchPriority="high"
          media="(max-width: 767px)"
          imageSrcSet="/hero-mobile-2x-pan.webp 2x, /hero-mobile-3x-pan.webp 3x"
        />
        <link
          rel="preload"
          as="image"
          type="image/webp"
          fetchPriority="high"
          media="(min-width: 768px)"
          href="/hero-cards/card1.webp"
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
