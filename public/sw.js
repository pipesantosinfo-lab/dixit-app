/**
 * Service Worker para el validador offline.
 * Cachea la página /validar y sus assets para que funcione sin internet.
 * NUNCA cachea endpoints /api/ — esos siempre van a la red (o fallan limpio).
 */

const CACHE_VERSION = 'v1'
const CACHE_NAME = `pipesantos-validador-${CACHE_VERSION}`

// Rutas que pre-cachemos al instalar
const CORE_ROUTES = [
  '/validar',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-header-v2.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ROUTES).catch((err) => {
        console.warn('SW: pre-cache parcial', err)
      })
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('pipesantos-validador-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Solo cachear GETs del mismo origen
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Nunca cachear API — siempre fresco o falla
  if (url.pathname.startsWith('/api/')) return

  // Solo cachear rutas del validador y assets estáticos
  const isValidatorRoute = url.pathname === '/validar' || url.pathname.startsWith('/validar/')
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/logo-header-v2.png' ||
    url.pathname === '/manifest.webmanifest'

  if (!isValidatorRoute && !isStaticAsset) return

  // Estrategia: stale-while-revalidate
  // - Devuelve la versión cacheada inmediatamente (rápido, funciona offline)
  // - En paralelo, intenta actualizarla en background
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request)
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        })
        .catch(() => cachedResponse) // Si falla la red, usar cache

      return cachedResponse || networkFetch
    })
  )
})
