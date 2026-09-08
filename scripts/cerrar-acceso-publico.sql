-- ═══════════════════════════════════════════════════════════════════════
-- Cierra el acceso publico de lectura a las tablas de Supabase.
--
-- Contexto: la auditoria del 31/08/2026 encontro que events, ticket_tiers,
-- event_photos y photo_raffles devuelven filas a cualquiera que use la llave
-- anonima. event_photos expone el ticket_number completo y el nombre de cada
-- asistente que subio foto, y photo_raffles el ticket del ganador.
--
-- Es seguro cerrarlas: TODAS las consultas de la aplicacion pasan por el
-- servidor usando la llave de servicio (lib/supabase.ts -> supabaseAdmin),
-- que ignora RLS por completo. Ningun componente de cliente habla con
-- Supabase directamente, asi que quitar el acceso anonimo no rompe nada.
--
-- Como aplicarlo: Supabase -> SQL Editor -> pegar -> Run.
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- 1) RLS activo en todas las tablas (idempotente).
alter table if exists public.events           enable row level security;
alter table if exists public.ticket_tiers     enable row level security;
alter table if exists public.tickets          enable row level security;
alter table if exists public.lavida_tickets   enable row level security;
alter table if exists public.raffles          enable row level security;
alter table if exists public.raffle_entries   enable row level security;
alter table if exists public.event_photos     enable row level security;
alter table if exists public.photo_raffles    enable row level security;
alter table if exists public.analytics_events enable row level security;

-- 2) Elimina toda politica existente sobre esas tablas.
--    Con RLS activo y cero politicas, los roles anon y authenticated no
--    pueden leer ni escribir nada. service_role no se ve afectado: salta
--    RLS por diseño, que es como funciona la app.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in (
         'events', 'ticket_tiers', 'tickets', 'lavida_tickets', 'raffles',
         'raffle_entries', 'event_photos', 'photo_raffles', 'analytics_events'
       )
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    raise notice 'politica eliminada: % en %', p.policyname, p.tablename;
  end loop;
end $$;

commit;

-- 3) Verificacion. rls_activo debe ser true y politicas debe ser 0
--    en las nueve tablas.
select t.tablename,
       t.rowsecurity as rls_activo,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = t.tablename) as politicas
  from pg_tables t
 where t.schemaname = 'public'
   and t.tablename in (
     'events', 'ticket_tiers', 'tickets', 'lavida_tickets', 'raffles',
     'raffle_entries', 'event_photos', 'photo_raffles', 'analytics_events'
   )
 order by t.tablename;
