/** @type {import('next').NextConfig} */

/* El interruptor de la landing vive en lib/evento.ts y se lee de ahi, no se
   copia: tener el mismo dato en dos sitios es como terminaba el precio en
   cinco archivos distintos. Hace falta aqui porque `redirect()` dentro de la
   pagina devuelve un 307 SIN cabecera Location —los navegadores lo resuelven
   por JavaScript, pero un rastreador o la vista previa de WhatsApp se
   quedaban con el anuncio del evento—. Un redirect de configuracion si manda
   Location, y ocurre antes de renderizar nada. */
const landingActiva = /landingActiva:\s*true/.test(
  require('fs').readFileSync(require('path').join(__dirname, 'lib/evento.ts'), 'utf8')
)

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',     value: 'on' },
  { key: 'X-Frame-Options',            value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.bold.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://integrations.api.bold.co",
      "frame-src https://checkout.bold.co https://open.spotify.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  // /api/tarjeta dibuja la tarjeta del correo con las fuentes de lib/fonts,
  // leidas con fs. Vercel solo empaqueta lo que rastrea en el codigo; esto
  // garantiza que los .ttf viajen con la funcion.
  experimental: {
    outputFileTracingIncludes: { '/api/tarjeta/[number]': ['./lib/fonts/*.ttf'] },
  },
  // Compresión de respuestas (gzip/brotli) automática
  compress: true,
  // Remueve la cabecera X-Powered-By: Next.js (pequeña reducción + seguridad)
  poweredByHeader: false,
  // Optimizaciones de imágenes
  images: {
    domains: ['images.unsplash.com'],
    // Formatos modernos: AVIF (30% menor que WebP) y WebP (30% menor que JPEG)
    formats: ['image/avif', 'image/webp'],
    // Cache de 60s para imágenes optimizadas — reduce procesamiento repetido
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 días
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // El validador de QR necesita acceso a la cámara — sobreescribe Permissions-Policy solo en esa ruta
        source: '/validar',
        headers: [
          { key: 'Permissions-Policy', value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      {
        // Assets estáticos: cache largo + immutable (los nombres tienen hash)
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Imágenes en /public: cache de 1 día con revalidación
        source: '/:path*\\.(png|jpg|jpeg|webp|avif|gif|svg|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // Videos: cache de 1 día
        source: '/:path*\\.(mp4|webm)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },
  // El sitio vivia en /preview y la raiz redirigia alli, asi que esa
  // direccion quedaba a la vista en la barra del navegador. Ahora el
  // contenido esta en la raiz; este redirect mantiene funcionando los
  // enlaces antiguos que todavia apunten a /preview.
  async redirects() {
    return [
      { source: '/preview', destination: '/', permanent: true },
      // Pagina antigua del evento de Barranquilla, con los datos escritos a
      // mano. La seccion #evento de la portada lee de lib/evento.ts.
      { source: '/evento', destination: '/#evento', permanent: false },
      // Landing apagada: quien llegue por el enlace de la bio cae en la
      // portada. Temporal a proposito (permanent: false): cuando se vuelva
      // a encender, nadie se queda con el salto guardado en el navegador.
      ...(landingActiva ? [] : [{ source: '/cartagena', destination: '/', permanent: false }]),
    ]
  },
}

module.exports = nextConfig
