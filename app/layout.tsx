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
  title: 'Pipe Santos — Escritor, conferencista e influencer',
  description: 'Pipe Santos — Escritor, conferencista e influencer del Caribe colombiano.',
  openGraph: {
    title: 'Pipe Santos — Escritor, conferencista e influencer',
    description: 'Pipe Santos — Escritor, conferencista e influencer del Caribe colombiano.',
    images: ['/logo.png'],
    siteName: 'Pipe Santos',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pipe Santos — Escritor, conferencista e influencer',
    description: 'Pipe Santos — Escritor, conferencista e influencer del Caribe colombiano.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="bg-void text-white antialiased font-body">
        {children}
      </body>
    </html>
  )
}
