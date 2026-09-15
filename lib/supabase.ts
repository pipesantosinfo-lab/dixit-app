import { createClient } from '@supabase/supabase-js'

/**
 * Todo el acceso a la base de datos pasa por aqui, y siempre desde el
 * servidor: rutas de API y componentes de servidor. El navegador nunca habla
 * con Supabase directamente.
 *
 * Antes se exportaba tambien un cliente con la llave anonima
 * (NEXT_PUBLIC_SUPABASE_ANON_KEY) que no usaba nadie. Se elimino: mientras
 * existiera, bastaba con que alguien lo importara desde un componente de
 * cliente para que esa llave quedara publicada en el bundle, y con ella se
 * pueden consultar las tablas que no tengan RLS bien cerrado.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Solo servidor — la llave de servicio ignora RLS, nunca debe llegar al cliente.
//
// cache: 'no-store' en cada peticion: Next.js guarda en su Data Cache los
// GET que hace fetch() dentro de las rutas de API, y supabase-js consulta
// con GET. Sin esto, /api/admin/reporte-landing devolvio durante horas las
// cifras del primer dia (0 visitas, 3 compras) aunque la base tenia 52
// visitas y 7 entradas. Una lectura de la base nunca debe salir de una cache.
export const supabaseAdmin = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) },
  })
