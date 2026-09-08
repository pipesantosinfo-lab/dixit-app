const { Client } = require('pg');

const sql = `
ALTER TABLE IF EXISTS events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_tiers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lavida_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raffles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raffle_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS photo_raffles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events    ENABLE ROW LEVEL SECURITY;
`;

async function run() {
  // Conexión directa Supabase
  const client = new Client({
    host: 'db.fsqzedajblwiismrdufa.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.DB_PASS,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Conectado!');
    await client.query(sql);
    console.log('RLS habilitado en todas las tablas');
    const { rows } = await client.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    console.table(rows);
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}
run();
