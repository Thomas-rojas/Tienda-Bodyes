-- CLIO · Schema de productos, pedidos e inventario
-- Ejecutar en Supabase → SQL Editor (una vez)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null default 'mujeres',
  price_cents integer not null check (price_cents > 0),
  stock integer not null default 0 check (stock >= 0),
  image_path text not null,
  alt text,
  color text,
  material text,
  fit text,
  size text default 'Talla única',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (active);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'declined', 'error', 'voided')),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  document_type text not null,
  document_number text not null,
  address text not null,
  city text not null,
  region text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'COP',
  wompi_transaction_id text,
  payment_method_type text,
  notifications_sent boolean not null default false,
  fulfilled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_reference_idx on public.orders (reference);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_wompi_tx_idx on public.orders (wompi_transaction_id);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id),
  name text not null,
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- FulFill order: descuenta stock de forma atómica e idempotente
-- ---------------------------------------------------------------------------
create or replace function public.fulfill_paid_order(p_reference text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order
  from public.orders
  where reference = p_reference
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  if v_order.fulfilled then
    return jsonb_build_object('ok', true, 'already_fulfilled', true, 'order_id', v_order.id);
  end if;

  if v_order.status <> 'paid' then
    return jsonb_build_object('ok', false, 'error', 'order_not_paid', 'status', v_order.status);
  end if;

  for v_item in
    select * from public.order_items where order_id = v_order.id
  loop
    update public.products
    set stock = stock - v_item.quantity
    where id = v_item.product_id
      and stock >= v_item.quantity;

    if not found then
      raise exception 'insufficient_stock for product %', v_item.product_id;
    end if;
  end loop;

  update public.orders
  set fulfilled = true
  where id = v_order.id;

  return jsonb_build_object('ok', true, 'already_fulfilled', false, 'order_id', v_order.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: lectura pública de productos activos; orders solo service role
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select
  using (active = true);

-- Sin policies de insert/update para anon → solo service role (bypass RLS)

-- ---------------------------------------------------------------------------
-- Seed (precios en centavos COP)
-- ---------------------------------------------------------------------------
insert into public.products (
  id, slug, name, category, price_cents, stock, image_path, alt,
  color, material, fit, size, description
) values
  (
    'm1', 'clio-basico-essential-nude', 'Clio Básico Essential Nude', 'mujeres', 14000000, 20,
    '/images/catalog-mujer-1.jpg', 'Clio Básico Essential Nude para mujeres',
    'Nude beige', 'Tela premium stretch, transpirable', 'Ajuste moldeador suave', 'Talla única',
    'Body básico esencial en tono nude que se siente como una segunda piel. Ideal para usar solo o como base de cualquier outfit.'
  ),
  (
    'm2', 'clio-basico-terracota-soft', 'Clio Básico Terracota Soft', 'mujeres', 16800000, 20,
    '/images/catalog-mujer-2.jpg', 'Clio Básico Terracota Soft para mujeres',
    'Terracota', 'Algodón suave con elastano', 'Manga larga, silueta definida', 'Talla única',
    'Pieza básica cálida en terracota con manga larga. Combina comodidad diaria con un acabado elegante y conscious.'
  ),
  (
    'm3', 'clio-basico-rib-verde', 'Clio Básico Rib Verde', 'mujeres', 12800000, 20,
    '/images/catalog-mujer-3.jpg', 'Clio Básico Rib Verde para mujeres',
    'Verde oliva', 'Rib stretch ligero', 'Sin mangas, corte confort', 'Talla única',
    'Body básico rib en verde oliva, fresco y versátil. Perfecto para el día a día sin sacrificar estilo.'
  ),
  (
    'm4', 'clio-basico-cuello-alto', 'Clio Básico Cuello Alto', 'mujeres', 18000000, 20,
    '/images/catalog-mujer-4.jpg', 'Clio Básico Cuello Alto para mujeres',
    'Carbón', 'Punto suave de alta recuperación', 'Cuello alto, manga larga', 'Talla única',
    'Básico chic con cuello alto. Una base sofisticada para looks de oficina o noche.'
  ),
  (
    'm5', 'clio-basico-essential', 'Clio Básico Essential', 'mujeres', 14000000, 20,
    '/images/coleccion-1.jpg', 'Clio Básico Essential negro',
    'Negro', 'Tela premium stretch', 'Manga corta, corte clásico', 'Talla única',
    'El básico que no puede faltar. Negro elegante, ajuste cómodo y sensación second-skin.'
  ),
  (
    'm6', 'clio-basico-encaje-elegance', 'Clio Básico Encaje Elegance', 'mujeres', 19200000, 20,
    '/images/coleccion-2.jpg', 'Clio Básico Encaje Elegance rosa',
    'Rosa dusty', 'Encaje suave forrado', 'Manga larga, silueta femenina', 'Talla única',
    'Básico con detalle de encaje y acabado delicado. Diseñado para momentos especiales sin perder comodidad.'
  ),
  (
    'm7', 'clio-basico-rib-confort', 'Clio Básico Rib Confort', 'mujeres', 12800000, 20,
    '/images/coleccion-3.jpg', 'Clio Básico Rib Confort verde oliva',
    'Verde oliva', 'Rib stretch', 'Sin mangas, confort total', 'Talla única',
    'Básico con textura rib y libertad de movimiento. Ideal para looks casuales con presencia.'
  ),
  (
    'm8', 'clio-basico-cuello-alto-chic', 'Clio Básico Cuello Alto Chic', 'mujeres', 16800000, 20,
    '/images/coleccion-4.jpg', 'Clio Básico Cuello Alto Chic gris',
    'Gris oscuro', 'Punto suave', 'Cuello alto, manga larga', 'Talla única',
    'Versión básica chic en gris. Un body minimalista para elevar cualquier conjunto.'
  )
on conflict (id) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  image_path = excluded.image_path,
  alt = excluded.alt,
  color = excluded.color,
  material = excluded.material,
  fit = excluded.fit,
  size = excluded.size,
  description = excluded.description,
  active = true;
