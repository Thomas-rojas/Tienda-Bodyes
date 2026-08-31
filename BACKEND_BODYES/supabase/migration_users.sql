-- Usuarios con roles (admin | cliente)
-- Ejecutar en Supabase SQL Editor después de schema.sql

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  phone text not null,
  document_type text not null default 'CC',
  document_number text not null,
  password_hash text not null,
  role text not null default 'cliente' check (role in ('admin', 'cliente')),
  address text,
  city text,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_document_unique unique (document_type, document_number)
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_document_idx on public.users (document_number);
create index if not exists users_role_idx on public.users (role);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

-- Estado logístico del pedido (independiente del pago)
alter table public.orders
  add column if not exists fulfillment_status text not null default 'pendiente'
  check (fulfillment_status in ('pendiente', 'en_proceso', 'enviado', 'entregado', 'cancelado'));

create index if not exists orders_fulfillment_idx on public.orders (fulfillment_status);
