-- CMS: colecciones, contenido del sitio, cupones, campos extra en productos/pedidos
-- Ejecutar en Supabase SQL Editor después de schema.sql y migration_users.sql

-- Colecciones de bodys
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  image_path text not null,
  alt text,
  description text,
  sort_order int not null default 0,
  featured boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collections_active_idx on public.collections (active, sort_order);

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

alter table public.collections enable row level security;

-- Campos extra en productos
alter table public.products
  add column if not exists coleccion text,
  add column if not exists compare_at_cents integer,
  add column if not exists featured boolean not null default false;

create index if not exists products_coleccion_idx on public.products (coleccion);
create index if not exists products_featured_idx on public.products (featured);

-- Contenido editable del sitio (key-value JSON)
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Cupones de descuento
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  min_order_cents integer not null default 0,
  max_uses integer,
  uses_count integer not null default 0,
  collection_slug text,
  valid_from timestamptz,
  valid_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;

-- Tracking y historial de pedidos
alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists admin_notes text;

create table if not exists public.order_status_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_log_order_idx on public.order_status_log (order_id);

-- Newsletter
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Seed colecciones
insert into public.collections (slug, name, image_path, alt, sort_order, featured, active)
values
  ('esenciales', 'Esenciales', '/images/coleccion-1.jpg', 'Colección Esenciales CLIO', 1, true, true),
  ('encaje', 'Encaje', '/images/coleccion-2.jpg', 'Colección Encaje CLIO', 2, true, true),
  ('rib', 'Rib', '/images/coleccion-3.jpg', 'Colección Rib CLIO', 3, true, true),
  ('cuello-alto', 'Cuello Alto', '/images/coleccion-4.jpg', 'Colección Cuello Alto CLIO', 4, true, true)
on conflict (slug) do nothing;

-- Asignar colección a productos seed
update public.products set coleccion = 'esenciales' where id in ('m1', 'm2', 'm5');
update public.products set coleccion = 'encaje' where id = 'm6';
update public.products set coleccion = 'rib' where id in ('m3', 'm7');
update public.products set coleccion = 'cuello-alto' where id in ('m4', 'm8');

-- Contenido inicial del sitio
insert into public.site_content (key, value) values
  ('hero', '{
    "season": "Moda consciente · Cruelty free",
    "titleLine1": "Belleza",
    "titleLine2": "con compasión",
    "tagline": "Bodys premium hechos con amor — nunca a costa de quienes nos inspiran.",
    "ctaText": "Explorar la colección",
    "ctaLink": "/catalogo",
    "videoMp4": "/video/hero-bodys.mp4",
    "videoWebm": "/video/hero-bodys.webm",
    "poster": "/images/hero.jpg"
  }'::jsonb),
  ('navbar', '{"promoText":"Nueva colección — Descubrir bodys","promoLink":"/catalogo"}'::jsonb),
  ('footer', '{
    "instagram": "https://www.instagram.com/clioofficial.co?igsh=eTJib3kxdWo2ZjZ3",
    "tiktok": "https://www.tiktok.com/@cliooficial.co?_r=1&_t=ZS-98I5UabDAAP",
    "copyright": "CLIO · Bodys & lencería · Colombia"
  }'::jsonb),
  ('store', '{
    "name": "CLIO",
    "whatsapp": "573001234567",
    "supportEmail": "hola@clio.com"
  }'::jsonb)
on conflict (key) do nothing;
