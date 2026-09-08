-- ══════════════════════════════════════════════════════════════
--  DIXIT EVENTS — Habilitar Row Level Security en todas las tablas
--  Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════
--
--  Todas las rutas API del proyecto usan supabaseAdmin() con la
--  service_role key, que bypassa RLS automáticamente. No se
--  necesitan políticas permisivas: el acceso anónimo externo
--  queda completamente bloqueado.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_tiers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lavida_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raffles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raffle_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS photo_raffles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events    ENABLE ROW LEVEL SECURITY;

-- Verificar que RLS quedó activo en todas las tablas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
