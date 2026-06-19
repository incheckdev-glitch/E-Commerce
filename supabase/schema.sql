-- Perfume Ecommerce MVP schema for Supabase/Postgres
-- Run this in Supabase SQL Editor before running seed.sql.

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
do $$ begin
  create type public.user_role as enum ('customer', 'admin', 'manager', 'warehouse', 'support', 'accounting');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_status as enum ('draft', 'active', 'hidden', 'discontinued');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_gender as enum ('women', 'men', 'unisex');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending_payment', 'confirmed', 'processing', 'packing', 'ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'cod_pending', 'paid', 'failed', 'partially_refunded', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inventory_movement_type as enum ('purchase', 'sale_reserve', 'sale_complete', 'cancel_release', 'return_available', 'return_damaged', 'adjustment', 'damage', 'transfer');
exception when duplicate_object then null; end $$;

-- ---------- HELPERS ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'manager', 'warehouse', 'support', 'accounting')
  );
$$;

-- ---------- AUTH PROFILE ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- CATALOG ----------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country_of_origin text,
  description text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  category_id uuid references public.categories(id),
  name text not null,
  slug text not null unique,
  description text,
  gender public.product_gender not null default 'unisex',
  concentration text not null default 'EDP',
  scent_family text,
  top_notes text,
  heart_notes text,
  base_notes text,
  occasion text,
  season text,
  ingredients text,
  allergens text,
  country_of_origin text,
  batch_tracking_required boolean not null default true,
  sample_available boolean not null default false,
  tester_available boolean not null default false,
  gift_wrap_available boolean not null default true,
  is_returnable boolean not null default true,
  has_shipping_restriction boolean not null default true,
  status public.product_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  barcode text,
  size_ml int not null check (size_ml > 0),
  concentration text not null default 'EDP',
  cost_price numeric(12,2) not null default 0,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  reserved_quantity int not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold int not null default 5,
  weight_grams int,
  batch_number text,
  expiry_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type public.inventory_movement_type not null,
  quantity int not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- CUSTOMERS ----------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  preferred_scent_family text,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_email_phone_unique unique nulls not distinct (email, phone)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  label text default 'Shipping',
  country text not null,
  city text not null,
  area text,
  street text not null,
  building text,
  floor text,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ORDERS ----------
create sequence if not exists public.order_number_seq start with 1;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  customer_id uuid references public.customers(id),
  shipping_address_id uuid references public.addresses(id),
  order_status public.order_status not null default 'confirmed',
  payment_status public.payment_status not null default 'unpaid',
  payment_method text not null default 'cash_on_delivery',
  delivery_method text not null default 'standard_delivery',
  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  coupon_code text,
  gift_wrap boolean not null default false,
  gift_message text,
  customer_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  brand_name text not null,
  product_name text not null,
  sku text,
  size_ml int,
  concentration text,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  total_price numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null,
  payment_status public.payment_status not null,
  amount numeric(12,2) not null,
  gateway_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_name text,
  tracking_number text,
  delivery_status text not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- COUPONS / REVIEWS / RETURNS ----------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed', 'free_delivery')),
  discount_value numeric(12,2) not null default 0,
  minimum_order_amount numeric(12,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id),
  reason text not null,
  status text not null default 'requested',
  sealed_condition boolean,
  photo_url text,
  admin_notes text,
  refund_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id),
  customer_id uuid references public.customers(id),
  rating int not null check (rating between 1 and 5),
  longevity_rating int check (longevity_rating between 1 and 5),
  sillage_rating int check (sillage_rating between 1 and 5),
  title text,
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  country text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id),
  po_number text not null unique,
  status text not null default 'draft',
  total_amount numeric(12,2) not null default 0,
  expected_arrival date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references public.purchase_orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id),
  quantity int not null check (quantity > 0),
  unit_cost numeric(12,2) not null default 0,
  batch_number text,
  expiry_date date,
  created_at timestamptz not null default now()
);

-- ---------- TRIGGERS ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','brands','categories','products','product_variants','customers','addresses','orders','shipments','returns','suppliers','purchase_orders'] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------- CHECKOUT RPC ----------
create or replace function public.create_checkout_order(
  p_customer jsonb,
  p_shipping_address jsonb,
  p_items jsonb,
  p_payment_method text default 'cash_on_delivery',
  p_delivery_method text default 'standard_delivery',
  p_coupon_code text default null,
  p_gift jsonb default '{}'::jsonb
)
returns table(order_id uuid, order_number text, order_total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_address_id uuid;
  v_order_id uuid;
  v_item jsonb;
  v_variant_id uuid;
  v_qty int;
  v_variant record;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_coupon record;
  v_payment_status public.payment_status := 'unpaid';
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into public.customers (full_name, email, phone)
  values (p_customer->>'full_name', lower(p_customer->>'email'), p_customer->>'phone')
  on conflict (email, phone) do update set
    full_name = excluded.full_name,
    updated_at = now()
  returning id into v_customer_id;

  insert into public.addresses (customer_id, country, city, area, street, building, floor, notes)
  values (
    v_customer_id,
    coalesce(p_shipping_address->>'country', ''),
    coalesce(p_shipping_address->>'city', ''),
    p_shipping_address->>'area',
    coalesce(p_shipping_address->>'street', ''),
    p_shipping_address->>'building',
    p_shipping_address->>'floor',
    p_shipping_address->>'notes'
  ) returning id into v_address_id;

  if p_delivery_method = 'store_pickup' then
    v_delivery := 0;
  elsif p_delivery_method = 'same_day_delivery' then
    v_delivery := 6;
  else
    v_delivery := 3;
  end if;

  if p_payment_method = 'cash_on_delivery' then
    v_payment_status := 'cod_pending';
  else
    v_payment_status := 'unpaid';
  end if;

  insert into public.orders (
    customer_id,
    shipping_address_id,
    payment_method,
    payment_status,
    delivery_method,
    order_status,
    gift_wrap,
    gift_message,
    customer_notes
  ) values (
    v_customer_id,
    v_address_id,
    p_payment_method,
    v_payment_status,
    p_delivery_method,
    'confirmed',
    coalesce((p_gift->>'gift_wrap')::boolean, false),
    p_gift->>'gift_message',
    p_shipping_address->>'notes'
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := greatest((v_item->>'quantity')::int, 1);

    select
      pv.id,
      pv.product_id,
      pv.sku,
      pv.size_ml,
      pv.concentration,
      pv.price,
      pv.stock_quantity,
      p.name as product_name,
      p.status as product_status,
      b.name as brand_name
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    left join public.brands b on b.id = p.brand_id
    where pv.id = v_variant_id
    for update of pv;

    if not found then
      raise exception 'Product variant not found';
    end if;

    if v_variant.product_status <> 'active' then
      raise exception 'Product % is not active', v_variant.product_name;
    end if;

    if v_variant.stock_quantity < v_qty then
      raise exception 'Insufficient stock for %. Available: %', v_variant.product_name, v_variant.stock_quantity;
    end if;

    update public.product_variants
    set stock_quantity = stock_quantity - v_qty,
        reserved_quantity = reserved_quantity + v_qty,
        updated_at = now()
    where id = v_variant_id;

    insert into public.order_items (
      order_id, product_id, variant_id, brand_name, product_name, sku, size_ml, concentration, quantity, unit_price, total_price
    ) values (
      v_order_id,
      v_variant.product_id,
      v_variant.id,
      coalesce(v_variant.brand_name, 'Maison'),
      v_variant.product_name,
      v_variant.sku,
      v_variant.size_ml,
      v_variant.concentration,
      v_qty,
      v_variant.price,
      v_variant.price * v_qty
    );

    insert into public.inventory_movements (variant_id, movement_type, quantity, reference_type, reference_id, notes)
    values (v_variant_id, 'sale_reserve', -v_qty, 'order', v_order_id, 'Reserved during ecommerce checkout');

    v_subtotal := v_subtotal + (v_variant.price * v_qty);
  end loop;

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_coupon
    from public.coupons
    where lower(code) = lower(trim(p_coupon_code))
      and is_active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
      and (max_uses is null or used_count < max_uses)
    limit 1;

    if found and v_subtotal >= v_coupon.minimum_order_amount then
      if v_coupon.discount_type = 'percentage' then
        v_discount := round(v_subtotal * (v_coupon.discount_value / 100), 2);
      elsif v_coupon.discount_type = 'fixed' then
        v_discount := least(v_coupon.discount_value, v_subtotal);
      elsif v_coupon.discount_type = 'free_delivery' then
        v_discount := v_delivery;
      end if;
      update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
    end if;
  end if;

  v_total := greatest(v_subtotal - v_discount + v_delivery, 0);

  update public.orders
  set subtotal_amount = v_subtotal,
      discount_amount = v_discount,
      delivery_fee = v_delivery,
      total_amount = v_total,
      coupon_code = nullif(trim(coalesce(p_coupon_code, '')), ''),
      updated_at = now()
  where id = v_order_id;

  insert into public.payments (order_id, payment_method, payment_status, amount)
  values (v_order_id, p_payment_method, v_payment_status, v_total);

  insert into public.shipments (order_id, delivery_status)
  values (v_order_id, 'pending');

  return query
    select o.id, o.order_number, o.total_amount
    from public.orders o
    where o.id = v_order_id;
end;
$$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.coupons enable row level security;
alter table public.returns enable row level security;
alter table public.reviews enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

-- Public catalog read policies.
do $$ begin
  create policy "Public can read active brands" on public.brands for select using (is_active = true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can read active categories" on public.categories for select using (is_active = true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can read active products" on public.products for select using (status = 'active');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can read active product variants" on public.product_variants for select using (
    is_active = true and exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can read active product images" on public.product_images for select using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );
exception when duplicate_object then null; end $$;

-- User profile policies.
do $$ begin
  create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin_user());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Admin all-data policies.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'brands','categories','products','product_variants','product_images','inventory_movements','customers','addresses','orders','order_items','payments','shipments','coupons','returns','reviews','suppliers','purchase_orders','purchase_order_items'
  ] loop
    execute format('create policy "Admin full access %I" on public.%I for all using (public.is_admin_user()) with check (public.is_admin_user())', tbl, tbl);
  end loop;
exception when duplicate_object then null;
end $$;

-- Reviews: public can read approved only.
do $$ begin
  create policy "Public can read approved reviews" on public.reviews for select using (is_approved = true);
exception when duplicate_object then null; end $$;

-- Authenticated users can request returns/reviews for their own linked customer records later.
-- Checkout uses the secure service-role RPC from the Next.js server action.
