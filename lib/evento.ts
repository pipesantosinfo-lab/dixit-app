/**
 * Datos del evento en vivo. ÚNICO lugar donde se escriben.
 *
 * Antes de este archivo, el nombre del show, la ciudad, la fecha, el precio
 * y el aforo estaban escritos a mano en siete archivos distintos (la
 * portada, el modal de compra, la barra flotante, el correo, la entrada
 * digital, la descripción del pago en Bold, la página de éxito y el
 * webhook). El precio, por ejemplo, aparecía en cinco sitios: bastaba con
 * cambiar cuatro y olvidar uno para cobrar un valor mostrando otro.
 *
 * Para el próximo evento: se cambia este archivo, se cambia el flyer en
 * /public (con nombre nuevo, por la caché — ver CLAUDE.md), se limpia la
 * tabla lavida_tickets de la base de datos, y listo.
 *
 * Todo lo que dependa de fecha usa `fecha` (un Date real). Los textos
 * derivados (`fechaCorta`, `mes`, `dia`) existen porque cada sitio los
 * muestra distinto y así no hay formateo repartido por el código.
 */
export const EVENTO = {
  /**
   * El unico interruptor de la seccion de evento en la portada: la seccion,
   * el boton del hero, la barra flotante en movil y el enlace del menu.
   * Apagarlo NO apaga las ventas (eso es sales.json en Supabase, desde el
   * panel de admin): solo esconde la seccion. Con activo=false y ventas
   * abiertas, nadie encuentra donde comprar.
   */
  activo: true,

  /** Nombre del show tal como va en el flyer. */
  nombre: 'Historias sin libreto',

  ciudad: 'Cartagena',
  /** Lo que ve el comprador en el correo y en la entrada como "Lugar". */
  lugar: 'Auditorio Dionisio Vélez, Unitecnar',
  direccion: 'Av. Pedro de Heredia, Calle 49A #31-45',

  /** Instante real del evento, con zona horaria de Colombia. */
  fecha: new Date('2026-10-24T14:00:00-05:00'),
  /** Para el correo de confirmación. */
  fechaTexto: 'Sábado 24 de octubre de 2026 · 2:00 PM',
  /** Para la tarjeta de la portada (mes arriba, día grande). */
  mes: 'OCT',
  dia: '24',
  /** Para la barra flotante, la entrada digital y el texto de Instagram. */
  fechaCorta: '24 oct',
  horaTexto: '2:00 PM',

  /** En pesos, sin puntos. Es el que se cobra en Bold. */
  precio: 40000,
  /** Como se muestra. Debe corresponder a `precio`. */
  precioTexto: '$40.000',

  /**
   * Cupos totales. NO se comunica al público: el dueño pidió que el número
   * no aparezca en la página. Solo sirve para cortar las ventas al llegar y
   * para escalar los mensajes de urgencia por porcentaje.
   */
  aforo: 115,

  /** Ruta en /public. Con sufijo de versión por la caché de un día. */
  flyer: '/flyer-cartagena-oct26-v2.webp',
  /**
   * El mismo flyer en JPG y a 600 px, para el correo de confirmacion. WebP
   * no abre en todos los clientes de correo. Se genera con sharp desde el
   * PNG original (ver scripts o el historial del 11/09/2026).
   */
  flyerCorreo: '/email/flyer-cartagena-oct26-v2.jpg',
} as const

/** Ciudad en mayúsculas para los mensajes de urgencia. */
export const CIUDAD_MAYUS = EVENTO.ciudad.toUpperCase()

/** Lo que sale en el extracto bancario del comprador y en el panel de Bold. */
export const DESCRIPCION_PAGO = `Entrada — ${EVENTO.nombre}`
