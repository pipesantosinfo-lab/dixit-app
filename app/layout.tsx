import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

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
        {/*
          El hero y el logo usan next/image con priority — Next.js inyecta
          automáticamente los <link rel="preload"> con la URL optimizada,
          así que no se duplica acá.
        */}
        {/* DNS prefetch para subdominios externos (parallel) */}
        <link rel="dns-prefetch" href="https://checkout.bold.co" />
        <link rel="dns-prefetch" href="https://open.spotify.com" />
      </head>
      <body className="bg-void text-white antialiased font-body">
        {children}
      </body>
    </html>
  )
}
