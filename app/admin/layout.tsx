import type { Metadata } from 'next'

/* page.tsx es un componente de cliente y no puede exportar metadata, asi que
   el noindex vive aqui. Complementa a app/robots.ts: robots pide que no se
   rastree, esto pide que no se indexe aunque alguien enlace la ruta. */
export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
