import fs from 'node:fs'
import path from 'node:path'
import { EVENTO } from '@/lib/evento'

/**
 * La tarjeta de informacion del correo de confirmacion, como IMAGEN.
 *
 * Gmail en iPhone invierte los colores del texto de los correos oscuros:
 * el titulo blanco se volvia negro sobre fondo negro y desaparecia. Contra
 * eso no hay CSS que valga; lo unico que Gmail nunca toca es una imagen.
 * Asi que la tarjeta se dibuja aqui (satori, via next/og) con las mismas
 * tipografias del sitio y se sirve desde /api/tarjeta/[number].
 *
 * Se dibuja al doble de tamaño (1120 px) y el correo la muestra a 560 px,
 * para que en pantallas retina se vea nitida.
 */

/* 420 px de ancho: en el celular el correo mide ~360-390 px, asi que la
 * imagen apenas se encoge y la letra conserva su tamaño. En escritorio queda
 * centrada, del ancho del poster. */
export const TARJETA = { ancho: 420, alto: 450, escala: 2 } as const

const FUENTES = path.join(process.cwd(), 'lib', 'fonts')
let cacheFuentes: { name: string; data: Buffer; weight: 400 | 500 | 700; style: 'normal' | 'italic' }[] | null = null

export function fuentesTarjeta() {
  if (!cacheFuentes) {
    cacheFuentes = [
      { name: 'Playfair', data: fs.readFileSync(path.join(FUENTES, 'PlayfairDisplay-Bold.ttf')),       weight: 700, style: 'normal' },
      { name: 'Playfair', data: fs.readFileSync(path.join(FUENTES, 'PlayfairDisplay-BoldItalic.ttf')), weight: 700, style: 'italic' },
      { name: 'DMSans',   data: fs.readFileSync(path.join(FUENTES, 'DMSans-Medium.ttf')),              weight: 500, style: 'normal' },
      { name: 'DMSans',   data: fs.readFileSync(path.join(FUENTES, 'DMSans-Bold.ttf')),                weight: 700, style: 'normal' },
      { name: 'DMMono',   data: fs.readFileSync(path.join(FUENTES, 'DMMono-Medium.ttf')),              weight: 500, style: 'normal' },
    ]
  }
  return cacheFuentes
}

interface Datos {
  nombre: string      // asistente
  codigo: string      // ticket_number corto, en mayusculas
}

export function TarjetaCorreo({ nombre, codigo }: Datos) {
  const k = TARJETA.escala
  const [primera, ...resto] = EVENTO.nombre.split(' ')
  const morado = '#c9a7ff'
  const naranja = '#ff9a3c'
  const etiqueta = '#9d8ac6'
  const linea = '#2f2050'

  const Etiqueta = ({ children }: { children: string }) => (
    <div style={{ display: 'flex', fontFamily: 'DMMono', fontWeight: 500, fontSize: 10 * k, letterSpacing: 3 * k, color: etiqueta, marginBottom: 6 * k }}>
      {children.toUpperCase()}
    </div>
  )

  return (
    <div style={{
      width: TARJETA.ancho * k, height: TARJETA.alto * k, display: 'flex',
      background: '#070508', padding: 2 * k,
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        backgroundImage: 'linear-gradient(165deg, #1d1236 0%, #100a1c 48%, #180e2d 100%)',
        border: `${1.5 * k}px solid #5b37a9`, borderRadius: 20 * k,
        padding: `${26 * k}px ${28 * k}px ${24 * k}px`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Halo morado arriba a la izquierda */}
        <div style={{
          position: 'absolute', left: -120 * k, top: -140 * k, width: 400 * k, height: 400 * k, borderRadius: 999,
          backgroundImage: 'radial-gradient(circle, rgba(139,60,247,0.28) 0%, rgba(139,60,247,0) 62%)',
        }} />
        {/* Halo naranja abajo a la derecha */}
        <div style={{
          position: 'absolute', right: -160 * k, bottom: -180 * k, width: 400 * k, height: 400 * k, borderRadius: 999,
          backgroundImage: 'radial-gradient(circle, rgba(255,154,60,0.16) 0%, rgba(255,154,60,0) 62%)',
        }} />

        {/* Cabecera: sello + titulo | fecha en caja */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 250 * k }}>
            <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'DMMono', fontWeight: 500, fontSize: 10 * k, letterSpacing: 3.5 * k, color: naranja }}>
              {/* El rombo va dibujado: DM Mono no trae el glifo ◆ */}
              <div style={{ width: 6 * k, height: 6 * k, backgroundColor: naranja, transform: 'rotate(45deg)', marginRight: 10 * k }} />
              ENTRADA CONFIRMADA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 * k, fontFamily: 'Playfair', fontWeight: 700, fontSize: 36 * k, lineHeight: 1.04, color: '#f7f2ff' }}>
              <span>{primera}</span>
              <span style={{ fontStyle: 'italic', color: morado }}>{resto.join(' ')}</span>
            </div>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: 96 * k, height: 96 * k, borderRadius: 14 * k,
            border: `${1 * k}px solid rgba(201,167,255,0.35)`, backgroundImage: 'linear-gradient(180deg, rgba(139,60,247,0.22), rgba(139,60,247,0.06))',
          }}>
            <div style={{ display: 'flex', fontFamily: 'DMMono', fontWeight: 500, fontSize: 10.5 * k, letterSpacing: 3 * k, color: naranja }}>{EVENTO.mes}</div>
            <div style={{ display: 'flex', fontFamily: 'Playfair', fontWeight: 700, fontSize: 42 * k, lineHeight: 1, color: '#ffffff', marginTop: 2 * k }}>{EVENTO.dia}</div>
            <div style={{ display: 'flex', fontFamily: 'DMSans', fontWeight: 700, fontSize: 11 * k, letterSpacing: 1 * k, color: morado, marginTop: 5 * k }}>{EVENTO.horaTexto}</div>
          </div>
        </div>

        {/* Fecha completa */}
        <div style={{ display: 'flex', marginTop: 12 * k, fontFamily: 'DMSans', fontWeight: 700, fontSize: 11.5 * k, letterSpacing: 1.8 * k, color: '#e3d6ff' }}>
          {EVENTO.fechaTexto.toUpperCase()}
        </div>

        {/* Separador con rombo */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 18 * k, marginBottom: 16 * k }}>
          <div style={{ flex: 1, height: 1 * k, backgroundColor: linea }} />
          <div style={{ width: 7 * k, height: 7 * k, backgroundColor: naranja, transform: 'rotate(45deg)', margin: `0 ${12 * k}px` }} />
          <div style={{ flex: 1, height: 1 * k, backgroundColor: linea }} />
        </div>

        {/* Datos */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Etiqueta>Asistente</Etiqueta>
          {/* Un nombre muy largo baja de tamaño para no salirse de la tarjeta (altura fija) */}
          <div style={{ display: 'flex', fontFamily: 'DMSans', fontWeight: 700, fontSize: (nombre.length > 44 ? 17 : 21) * k, color: '#ffffff', lineHeight: 1.15 }}>{nombre}</div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 * k }}>
            <Etiqueta>Lugar</Etiqueta>
            <div style={{ display: 'flex', fontFamily: 'DMSans', fontWeight: 700, fontSize: 16 * k, color: '#ffffff', lineHeight: 1.3 }}>{EVENTO.lugar}</div>
            <div style={{ display: 'flex', fontFamily: 'DMSans', fontWeight: 500, fontSize: 13 * k, color: morado, marginTop: 3 * k, lineHeight: 1.35 }}>{EVENTO.ciudad} · {EVENTO.direccion}</div>
          </div>

          <div style={{ display: 'flex', marginTop: 16 * k }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: 150 * k }}>
              <Etiqueta>Entrada</Etiqueta>
              <div style={{ display: 'flex', fontFamily: 'DMSans', fontWeight: 700, fontSize: 16 * k, color: naranja, lineHeight: 1.2 }}>General</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `${1 * k}px solid ${linea}`, paddingLeft: 18 * k }}>
              <Etiqueta>Número</Etiqueta>
              <div style={{ display: 'flex', fontFamily: 'DMMono', fontWeight: 500, fontSize: 14 * k, letterSpacing: 2 * k, color: '#e3d6ff', lineHeight: 1.2 }}>{codigo}</div>
            </div>
          </div>
        </div>

        {/* Pie: marca */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 18 * k }}>
          <div style={{ display: 'flex', fontFamily: 'DMMono', fontWeight: 500, fontSize: 9.5 * k, letterSpacing: 2.5 * k, color: etiqueta }}>VÁLIDA PARA UNA PERSONA</div>
          <div style={{ display: 'flex', fontFamily: 'Playfair', fontWeight: 700, fontStyle: 'italic', fontSize: 14 * k, color: morado }}>Pipe Santos</div>
        </div>
      </div>
    </div>
  )
}
