-- ══════════════════════════════════════════════
--  DIXIT EVENTS — Supabase Schema
--  Corre esto en el SQL Editor de Supabase
-- ══════════════════════════════════════════════

-- Tabla: eventos
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  tagline       text,
  description   text,
  date          text not null,
  doors_open    text,
  location      text not null,
  location_detail text,
  cover_image   text,
  video_url     text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- Tabla: tiers de tickets
create table if not exists ticket_tiers (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references events(id) on delete cascade,
  name            text not null,
  description     text,
  price           integer not null,    -- centavos
  currency        text default 'cop',
  total_quantity  integer not null,
  sold_quantity   integer default 0,
  color           text default '#7B68FF',
  is_active       boolean default true
);

-- Tabla: tickets comprados
create table if not exists tickets (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid references events(id),
  tier_id             uuid references ticket_tiers(id),
  ticket_number       text unique not null,
  buyer_name          text not null,
  buyer_email         text not null,
  buyer_phone         text,
  stripe_payment_id   text unique,
  qr_data             text not null,
  status              text default 'active' check (status in ('active','used','cancelled')),
  used_at             timestamptz,
  created_at          timestamptz default now()
);

-- Índices para búsqueda rápida
create index if not exists tickets_ticket_number_idx on tickets(ticket_number);
create index if not exists tickets_event_id_idx on tickets(event_id);
create index if not exists tickets_stripe_payment_id_idx on tickets(stripe_payment_id);

-- Función para incrementar sold_quantity atómicamente
create or replace function increment_sold_quantity(tier_id_param uuid)
returns void as $$
  update ticket_tiers
  set sold_quantity = sold_quantity + 1
  where id = tier_id_param;
$$ language sql;

-- ── DATOS DE EJEMPLO ──────────────────────────────────
-- Borra esto en producción o edítalo a tu gusto

insert into events (slug, name, tagline, description, date, doors_open, location, location_detail, cover_image) values (
  'dixit-vol1',
  'DIXIT Vol.1',
  'Una noche entre sueños y frecuencias',
  'DIXIT es una experiencia inmersiva donde el arte, la música y la conciencia se fusionan en un ritual colectivo. Cada rincón del espacio es una instalación. Cada sonido es una invitación.',
  'Viernes 14 de Febrero, 2025',
  'Puertas: 9:00 PM',
  'Casa del Aleph, Bogotá',
  'Cra 7 #45-21, La Candelaria',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400'
) on conflict do nothing;

-- Tiers del evento (usa el id del evento creado arriba)
insert into ticket_tiers (event_id, name, description, price, currency, total_quantity, color)
select 
  id,
  'Early Bird',
  'Acceso general. Precio especial para los primeros.',
  8000000,  -- COP $80,000
  'cop',
  50,
  '#00FFD1'
from events where slug = 'dixit-vol1'
on conflict do nothing;

insert into ticket_tiers (event_id, name, description, price, currency, total_quantity, color)
select 
  id,
  'General',
  'Acceso completo a la experiencia.',
  12000000,  -- COP $120,000
  'cop',
  150,
  '#7B68FF'
from events where slug = 'dixit-vol1'
on conflict do nothing;

insert into ticket_tiers (event_id, name, description, price, currency, total_quantity, color)
select 
  id,
  'VIP',
  'Acceso VIP + área exclusiva + welcome drink.',
  25000000,  -- COP $250,000
  'cop',
  30,
  '#FFD166'
from events where slug = 'dixit-vol1'
on conflict do nothing;
