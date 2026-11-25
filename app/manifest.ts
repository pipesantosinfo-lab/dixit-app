import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pipe Santos · Validador',
    short_name: 'Validador',
    description: 'Validador de entradas para los eventos de Pipe Santos',
    start_url: '/validar',
    scope: '/validar',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070508',
    theme_color: '#070508',
    icons: [
      { src: '/icon-192-v3.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // La versión 'maskable' va aparte: Android recorta el icono en círculo
      // y con el normal el punto morado de la esquina se perdía. Esta lleva
      // el dibujo encogido dentro de la zona segura y sin esquinas redondas.
      { src: '/icon-512-mask-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
