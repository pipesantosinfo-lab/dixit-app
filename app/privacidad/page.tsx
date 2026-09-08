import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Privacidad — Pipe Santos',
  description: 'Qué datos recoge pipesantos.com, para qué se usan y cómo pedir que se borren.',
  openGraph: {
    title: 'Privacidad — Pipe Santos',
    description: 'Qué datos recoge pipesantos.com, para qué se usan y cómo pedir que se borren.',
  },
}

/* Politica de tratamiento de datos (Ley 1581 de 2012, Decreto 1377 de 2013).
   Deliberadamente corta: solo lo que el articulo 13 del decreto exige —
   responsable, finalidad, derechos y canal de atencion. Todo lo demas se
   quito por pedido del cliente. Si algun dia la pagina empieza a usar
   cookies, publicidad o herramientas de terceros, hay que ampliarla y
   cambiar la fecha de abajo. */
const VIGENTE_DESDE = '31 de agosto de 2026'
const CORREO = 'pipesantosinfo@gmail.com'
const TELEFONO = '+57 302 824 5457'
const TELEFONO_LINK = '+573028245457'

/* Por defecto enlaza al correo; con `tel` enlaza al telefono, que en movil
   abre el marcador directamente. */
function Enlace({ children, tel }: { children: React.ReactNode; tel?: boolean }) {
  return (
    <a
      href={tel ? `tel:${TELEFONO_LINK}` : `mailto:${CORREO}`}
      className="text-white/80 underline decoration-white/20 underline-offset-4 hover:decoration-white/60 transition-colors whitespace-nowrap"
    >
      {children}
    </a>
  )
}

function Seccion({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-9" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-baseline gap-4 mb-5">
        <span className="font-mono text-xs text-white/20 tabular-nums shrink-0">{n}</span>
        <h2 className="font-display text-2xl md:text-[1.6rem] font-light text-white/90 leading-snug">{titulo}</h2>
      </div>
      <div className="space-y-4 font-body text-[15px] leading-relaxed text-white/55 md:pl-10">{children}</div>
    </section>
  )
}

export default function PrivacidadPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Luz de ambiente, igual que en el resto del sitio */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,60,247,0.13) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 px-6 md:px-12 py-10">
        <div className="max-w-2xl mx-auto">
          {/* ── Barra superior ─────────────────────── */}
          <div className="flex items-center justify-between mb-16 md:mb-24">
            <Link href="/" aria-label="Volver al inicio">
              <Image src="/logo.png" alt="Pipe Santos" width={100} height={38} className="opacity-50 hover:opacity-80 transition-opacity" />
            </Link>
            <Link
              href="/"
              className="font-mono text-xs tracking-widest uppercase text-white/30 hover:text-white/70 transition-colors"
            >
              ← Volver
            </Link>
          </div>

          {/* ── Cabecera ───────────────────────────── */}
          <header className="mb-12">
            <p className="font-mono text-xs tracking-[0.4em] text-aurora/70 uppercase mb-5">◆ Legal</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-white leading-[1.15] mb-6">
              Política de <span className="italic" style={{ color: 'rgba(139,60,247,0.85)' }}>privacidad</span>
            </h1>
            <p className="font-body text-white/45 text-[15px] leading-relaxed">
              Esta página no usa cookies ni rastreadores de terceros. Esto es todo lo que hay que saber.
            </p>
          </header>

          <div className="space-y-10">
            <Seccion n="01" titulo="Quién responde">
              <p>
                <strong className="text-white/80 font-medium">Santos Agencia Creativa</strong> (MOONSET S.A.S.),
                domiciliada en Cartagena de Indias, Colombia, titular de la marca Pipe Santos y responsable de este
                sitio.
              </p>
              <p>
                Canal de atención: <Enlace>{CORREO}</Enlace> · <Enlace tel>{TELEFONO}</Enlace>.
              </p>
            </Seccion>

            <Seccion n="02" titulo="Qué datos se recogen y para qué">
              <p>
                Si me escribes por el formulario de contacto, se recogen tu nombre, tu correo y tu mensaje, con una única
                finalidad: leerte y responderte. No se comparten con nadie, no van a ninguna lista de correos y no se
                usan para publicidad.
              </p>
              <p>
                La página también registra de forma anónima qué secciones se visitan y qué episodios se escuchan, para
                saber qué contenido interesa. Esos registros no van asociados a tu nombre ni permiten identificarte.
              </p>
              <p>
                Los datos se procesan en servicios de alojamiento que pueden estar ubicados fuera de Colombia.
              </p>
            </Seccion>

            <Seccion n="03" titulo="Tus derechos">
              <p>
                Puedes conocer, actualizar, rectificar o suprimir tus datos, y revocar en cualquier momento la
                autorización que diste, escribiendo a <Enlace>{CORREO}</Enlace>. También puedes presentar quejas ante la
                Superintendencia de Industria y Comercio.
              </p>
            </Seccion>
          </div>

          {/* ── Cierre ─────────────────────────────── */}
          <div className="mt-14 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="font-mono text-xs text-white/25">Vigente desde el {VIGENTE_DESDE}.</p>
            <p className="font-mono text-xs text-white/15 mt-3">© 2026 Pipe Santos. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
