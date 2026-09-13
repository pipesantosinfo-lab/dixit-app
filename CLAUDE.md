# Reglas de la casa — pipesantos.com

Sitio de Pipe Santos (Next.js 14, App Router) desplegado en Vercel.
Todo lo de aquí abajo salió de romper algo primero. No son preferencias:
son trampas conocidas de **este** proyecto.

## Lo primero, siempre

**Antes de cualquier cambio grande, etiquetar. Sin preguntar.**

```bash
git tag -a respaldo-antes-de-<lo-que-sea> -m "estado antes de ..." && git push origin --tags
```

La prioridad declarada del dueño es que nada se desordene y que siempre se
pueda volver atrás. Un tag cuesta cero y se borra si sobra. No es una tarea
que él tenga que recordar pedir.

Puntos de retorno vigentes: `estable-2026-09-07` (verificado compilando
desde cero en una carpeta limpia).

## Despliegue

**Cada push a `master` crea un despliegue automático.** No hace falta
`vercel --prod`; con hacer push basta. Ojo con esto: diez pushes en una
tarde son diez despliegues archivados de ~250 MB, y así se llenó el cupo de
10 GB de Deployment Storage el 06/09/2026.

Limpieza cuando llegue el aviso de Vercel:

```bash
npx vercel remove dixit-app --safe --yes   # --safe respeta el que sirve el dominio
```

**Los despliegues se construyen desde GitHub, no desde el disco local.** Lo
que no esté versionado NO existe en producción. Excluir `public/showreel/`
del repo dejó el showreel en 404 durante unos minutos. Antes de añadir algo
a `.gitignore`, preguntarse si el sitio lo sirve.

## Imágenes y video

**Al regenerar una imagen, renombrarla con sufijo `-vN`.** Las imágenes
salen con `max-age=86400, stale-while-revalidate=604800`: si el nombre no
cambia, los navegadores siguen mostrando la vieja durante días aunque el
servidor tenga la nueva. Ctrl+F5 no es fiable. Ya pasó dos veces: con el
hero y con `logos-mejor-v2.webp`.

**`scripts/optimizar-imagenes.mjs` reduce a 1400px de ancho máximo.** Está
pensado para fotos. Aplicarlo a una imagen ancha (cintas de logos,
panorámicas, banners) la destroza: la cinta de marcas es de 4560×300 y quedó
en 1400×92. Revisar anchos antes de pasarlo.

**En el hero móvil manda la ALTURA, no el ancho.** La foto llena un
contenedor vertical con `object-cover`, así que lo que hay que cubrir son los
~3.500 px de alto que pide un iPad con densidad 2 o un iPhone Pro con
densidad 3. Al pasar del recorte vertical a la foto horizontal completa —lo
que hizo falta para el control de paneo del 63%— la altura cayó de 4667 a
1334 y la imagen se estiraba 2,6 veces. Se sirve el frame completo a
5535×3690 por eso. Antes de tocar esas imágenes, medir en el navegador:
`img.getBoundingClientRect().height * devicePixelRatio`.

**Para imágenes con transparencia plana, WebP sin pérdida gana.** En la
cinta de logos: PNG 105 KB, WebP q85 149 KB, WebP sin pérdida **85 KB** e
idéntica al original. Medir antes de elegir formato.

**Video:** los `-web.mp4` comprimidos SÍ van versionados (el sitio los
sirve). Los originales `.mov` NO — están en el historial, en los commits del
19/08/2026, y se recuperan con
`git show 7b59c70:public/showreel/preconf-1.mov > salida.mov`.

## Evento en vivo (venta de entradas)

**Todos los datos del evento viven en `lib/evento.ts`.** Nombre, ciudad,
lugar, fecha, precio, aforo y flyer. Nada de eso se escribe en ningún otro
sitio: la portada, el modal de compra, la barra flotante, Bold, el correo,
la entrada digital y la página de éxito leen de ahí. Antes el precio estaba
en cinco archivos distintos.

**Dos interruptores, y no son el mismo:**
- `EVENTO.activo` (en el código) muestra u oculta la sección, el botón del
  hero, la barra móvil y el enlace del menú.
- `sales.json` en Supabase (desde `/admin` → toggle-sales) abre o cierra la
  venta. Lo consultan tanto la pantalla como `/api/create-order`.
Con la sección visible y ventas cerradas, el botón abre el modal de
"¡Las entradas abren muy pronto!" con la cuenta regresiva.

**Para un evento nuevo:** editar `lib/evento.ts`, poner el flyer en
`/public` con nombre nuevo (caché), vaciar `lavida_tickets` y `event_photos`
(y el bucket `event-photos`) de la base de datos, desplegar con ventas
cerradas, correr la prueba de compra, y solo entonces abrir ventas.

**El aforo no se comunica.** El dueño no quiere el número en la página; los
mensajes de urgencia escalan por porcentaje sin decirlo.

**Cómo se confirma un pago (dos caminos, y el segundo no depende de Bold):**
1. Webhook `/api/bold-webhook`. Bold firma HMAC-SHA256 hex con
   `BOLD_SECRET_KEY` sobre el cuerpo **en Base64** (no el cuerpo crudo), y
   para links de pago manda como `data.metadata.reference` el id del link
   (`LNK_...`), no nuestra referencia. Por eso `create-order` guarda el
   `LNK_` en `bold_order_id`. El webhook debe estar registrado en el panel
   de Bold (Integraciones → Webhooks); la primera compra real (12/09/2026)
   no lo estaba y la entrada quedó pendiente.
2. `/api/ticket-status`, que `/pago-exitoso` consulta cada 3 s: si la
   entrada sigue pendiente le pregunta a Bold por el link
   (`GET /online/link/v1/{LNK}`) y si dice `PAID` la activa ahí mismo.
   Con esto el comprador recibe su entrada aunque el webhook no llegue.

La activación (QR, correo, Excel al dueño) vive en `lib/activar-orden.ts`
y es idempotente.

**Prueba sin pagar:** mandar al webhook un `SALE_APPROVED` firmado (vale la
firma sobre Base64 como Bold, o sobre el cuerpo crudo). Recorre orden →
activación → correo → Excel → validador sin tocar Bold. Para activar a mano
una compra real que quedó pendiente, es lo mismo con su `reference`.

**Medición de la landing `/cartagena`:** cada visita (una por sesión, vía
`/api/landing/visita`) y cada toque en comprar se guardan en
`analytics_events` con `section = landing_cartagena`. Cada 10 visitas,
`lib/reporte-landing.ts` manda el embudo al dueño. Reporte a demanda:
`GET /api/admin/reporte-landing` (con `?enviar=1` lo manda por correo).

**`/api/validate-qr` espera `ticketNumber`** (camelCase). El validador de la
puerta usa `VALIDATOR_SECRET`; el segundo escaneo de una entrada devuelve
`status: 'already_used'`.

**El correo lleva el logo por URL absoluta**, no adjunto por `cid:`. Gmail
mostraba el adjunto como imagen rota.

**La tarjeta de datos del correo es una IMAGEN** (`/api/tarjeta/[number]`,
dibujada con `next/og` en `lib/tarjeta-correo.tsx`). Gmail en iPhone invierte
el texto blanco de los correos oscuros y el título desaparecía; una imagen no
se puede invertir. Si cambia el diseño, subir el `?v=` en `lib/email.ts`
(Gmail guarda la imagen por URL). Las fuentes viven en `lib/fonts/` y van
declaradas en `outputFileTracingIncludes` para que Vercel las empaquete.
En Windows `next/og` falla en local (`Invalid URL`, bug de rutas con
espacios); en Vercel (Linux) funciona. Para probar en local hay que parchear
`node_modules/next/dist/compiled/@vercel/og/index.node.js`:
`fileURLToPath(join(import.meta.url, ...))` → `join(fileURLToPath(import.meta.url), ...)`
y reiniciar el servidor.

## Seguridad

Auditoría completa contra producción, repetible:

```bash
npm run auditoria    # 11 comprobaciones, sale con código 1 si algo falla
```

Correrla después de tocar cualquier cosa de autenticación, RLS o rutas de
API. Si se añade una ruta de admin nueva, agregarla a `SOLO_ADMIN` dentro de
`scripts/auditoria-seguridad.mjs` para que también la vigile.

- **Toda la base de datos pasa por `supabaseAdmin` (servidor).** El cliente
  anónimo se eliminó a propósito: no lo usaba nadie y mantenía viva una
  llave pública. No reintroducirlo.
- **RLS cerrado**: las 9 tablas con RLS activo y cero políticas. El acceso
  anónimo no debe devolver ninguna fila.
- **`requireAdmin` ≠ `requireValidator`.** El PIN del validador se reparte
  entre el staff de la puerta y solo abre `sync-tickets`, `sync-used` y
  `validate-qr`. Todo lo demás (listados con cédulas, exportación, sorteos,
  ventas) es solo `ADMIN_SECRET`. No volver a mezclarlos.
- **Nunca juzgar una respuesta por su código HTTP.** Supabase devuelve 400
  tanto por "filtro de tipo de archivo" como por "regla de seguridad", y 200
  con cuerpo `[]`. Leer siempre el cuerpo antes de concluir.

## Datos personales en páginas públicas

Solo lo estrictamente obligatorio. El responsable es **Santos Agencia
Creativa (MOONSET S.A.S.)**, nunca el nombre personal, la cédula ni la
dirección de casa. Ver `app/privacidad/page.tsx`: está recortada a los cinco
ítems que exige el artículo 13 del Decreto 1377. Si el sitio empieza a usar
cookies o herramientas de terceros, hay que ampliarla y cambiar la fecha de
vigencia.

## Editar `app/preview/SitioCompleto.tsx`

Son ~4.100 líneas y es el sitio entero. `app/page.tsx` solo lo reexporta;
vive en `app/preview/` porque de ahí cuelgan sus piezas.

**Todo reemplazo por script debe verificar que hay exactamente 1
coincidencia, y abortar antes de escribir si no.** Una expresión regular con
`.*?` se comió ~600 líneas de este archivo de un golpe. Validar los cambios
primero, escribir después.

Detalles que hacen fallar los reemplazos en silencio:

- El archivo mezcla CRLF y LF. Construir los patrones con `\r?\n`.
- La indentación importa: `"  title: '...'"` con 2 espacios también coincide
  dentro de una línea con 4. Incluir la línea siguiente como contexto.

## Otras trampas conocidas

- **Safari no interpola `calc()` con variables dentro de `@keyframes`.** Por
  eso hay cinco keyframes `hero-card-float-N` con valores literales en vez de
  uno parametrizado. No "simplificarlos".
- **Para distinguir tablet de monitor** no basta `min-width`: se usa
  `@media (min-width: 1024px) and (min-aspect-ratio: 3/2)`. Un iPad cumple
  el ancho pero debe recibir la versión móvil.
- **`.env.local` nunca va a git.** Las 11 variables están también en Vercel;
  se recuperan con `npx vercel env pull`.
