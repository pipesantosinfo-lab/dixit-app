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

**Para imágenes con transparencia plana, WebP sin pérdida gana.** En la
cinta de logos: PNG 105 KB, WebP q85 149 KB, WebP sin pérdida **85 KB** e
idéntica al original. Medir antes de elegir formato.

**Video:** los `-web.mp4` comprimidos SÍ van versionados (el sitio los
sirve). Los originales `.mov` NO — están en el historial, en los commits del
19/08/2026, y se recuperan con
`git show 7b59c70:public/showreel/preconf-1.mov > salida.mov`.

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
