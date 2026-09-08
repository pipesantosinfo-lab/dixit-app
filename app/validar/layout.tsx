import type { Metadata } from 'next'

/* Mismo motivo que en app/admin/layout.tsx: el validador es componente de
   cliente y el noindex tiene que declararse desde el servidor. */
export const metadata: Metadata = {
  title: 'Validador',
  robots: { index: false, follow: false, nocache: true },
}

export default function ValidarLayout({ children }: { children: React.ReactNode }) {
  return children
}
