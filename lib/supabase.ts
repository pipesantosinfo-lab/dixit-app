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
export const supabaseAdmin = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
