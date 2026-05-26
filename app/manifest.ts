import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pipe Santos · Validador',
    short_name: 'Validador',
    description: 'Validador de entradas para el evento La vida es cule viaje',
    start_url: '/validar',
    scope: '/validar',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070508',
    theme_color: '#070508',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
