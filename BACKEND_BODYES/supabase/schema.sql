-- CLIO · Schema: productos, clientes, pedidos y pagos
-- Ejecutar en Supabase → SQL Editor (proyecto completo, una vez)
-- Dashboard: https://supabase.com/dashboard/project/asmfylasaikbmryrakcy/sql/new

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- customers (clientes)
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  phone text not null,
  document_type text not null,
  document_number text not null,
  address text,
  city text,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_email_unique unique (email),
  constraint customers_document_unique unique (document_type, document_number)
);

create index if not exists customers_email_idx on public.customers (email);
create index if not exists customers_phone_idx on public.customers (phone);

-- ---------------------------------------------------------------------------
-- products (productos / inventario)
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
create index if not exists products_category_idx on public.products (category);

-- ---------------------------------------------------------------------------
-- orders (pedidos; datos de cliente desnormalizados para recibos)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'declined', 'error', 'voided')),
  customer_id uuid references public.customers (id) on delete set null,
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

-- Compatibilidad si orders ya existía sin customer_id
alter table public.orders
  add column if not exists customer_id uuid references public.customers (id) on delete set null;

create index if not exists orders_customer_idx on public.orders (customer_id);

-- ---------------------------------------------------------------------------
-- payments (Mercado Pago / simulación)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'mercadopago',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'declined', 'error', 'voided')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'COP',
  provider_transaction_id text,
  payment_method_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_provider_tx_idx on public.payments (provider_transaction_id);

-- ---------------------------------------------------------------------------
-- order_items (líneas del pedido)
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
create index if not exists order_items_product_idx on public.order_items (product_id);

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

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Upsert cliente por email o documento
-- ---------------------------------------------------------------------------
create or replace function public.upsert_customer(
  p_email text,
  p_name text,
  p_phone text,
  p_document_type text,
  p_document_number text,
  p_address text,
  p_city text,
  p_region text
)
returns public.customers
language plpgsql
security definer
as $$
declare
  v_customer public.customers%rowtype;
begin
  select * into v_customer
  from public.customers
  where email = lower(trim(p_email))
     or (document_type = p_document_type and document_number = p_document_number)
  limit 1
  for update;

  if found then
    update public.customers set
      email = lower(trim(p_email)),
      name = p_name,
      phone = p_phone,
      document_type = p_document_type,
      document_number = p_document_number,
      address = coalesce(p_address, address),
      city = coalesce(p_city, city),
      region = coalesce(p_region, region)
    where id = v_customer.id
    returning * into v_customer;
  else
    insert into public.customers (
      email, name, phone, document_type, document_number, address, city, region
    ) values (
      lower(trim(p_email)), p_name, p_phone, p_document_type, p_document_number,
      p_address, p_city, p_region
    )
    returning * into v_customer;
  end if;

  return v_customer;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cumplir pedido pagado: descuenta stock de forma atómica e idempotente
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
-- RLS: productos activos públicos; resto solo service role
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.order_items enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select
  using (active = true);

-- Sin policies de escritura para anon → solo service role (bypass RLS)

-- ---------------------------------------------------------------------------
-- Seed productos (precios en centavos COP)
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
  slug = excluded.slug,
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
