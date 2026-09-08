import type { MetadataRoute } from 'next'

/* Le dice a los buscadores que no indexen las rutas internas. No es una
   medida de seguridad — quien conozca la direccion sigue llegando, y por eso
   /admin y /validar piden su clave — pero evita que el panel y el validador
   aparezcan en Google y queden a la vista de cualquiera que busque el sitio. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/validar', '/api/'],
    },
  }
}
