/** @type {import('next').NextConfig} */

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
}

module.exports = nextConfig
