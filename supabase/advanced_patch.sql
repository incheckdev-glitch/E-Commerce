-- L&C Perfume advanced ecommerce patch
-- Run this in Supabase SQL Editor after the original schema.sql and coupon_patch.sql.

create extension if not exists pgcrypto;

-- Product image storage bucket used by Admin > Products > Upload Image.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

-- Delivery fee zones.
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  country text not null default 'Lebanon',
  city text not null,
  area text,
  delivery_fee numeric(12,2) not null default 3,
  same_day_fee numeric(12,2) not null default 6,
  free_delivery_minimum numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists delivery_zones_unique_location
on public.delivery_zones (lower(country), lower(city), lower(coalesce(area, '')));

-- Order status timeline for admin status changes.
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Helpful indexes.
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(order_status);
create index if not exists idx_orders_payment on public.orders(payment_status);
create index if not exists idx_reviews_product_approved on public.reviews(product_id, is_approved);
create index if not exists idx_inventory_movements_variant_created on public.inventory_movements(variant_id, created_at desc);

-- Updated-at trigger for delivery zones.
do $$ begin
  drop trigger if exists set_delivery_zones_updated_at on public.delivery_zones;
  create trigger set_delivery_zones_updated_at before update on public.delivery_zones for each row execute function public.set_updated_at();
exception when undefined_function then null;
end $$;

-- RLS policies for new tables.
alter table public.delivery_zones enable row level security;
alter table public.order_status_history enable row level security;

do $$ begin
  create policy "Public can read active delivery zones" on public.delivery_zones for select using (is_active = true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin full access delivery_zones" on public.delivery_zones for all using (public.is_admin_user()) with check (public.is_admin_user());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin full access order_status_history" on public.order_status_history for all using (public.is_admin_user()) with check (public.is_admin_user());
exception when duplicate_object then null; end $$;

-- Storage policies for public product image reading and admin upload.
do $$ begin
  create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin_user());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin update product images" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin_user()) with check (bucket_id = 'product-images' and public.is_admin_user());
exception when duplicate_object then null; end $$;

-- Seed common Lebanon delivery zones.
insert into public.delivery_zones (country, city, area, delivery_fee, same_day_fee, free_delivery_minimum, is_active)
values
  ('Lebanon', 'Beirut', null, 3, 6, 100, true),
  ('Lebanon', 'Metn', null, 4, 7, 100, true),
  ('Lebanon', 'Baabda', null, 4, 7, 100, true),
  ('Lebanon', 'Keserwan', null, 5, 8, 120, true),
  ('Lebanon', 'Jbeil', null, 6, 10, 150, true)
on conflict do nothing;

-- Advanced checkout RPC: supports delivery-zone fee and optional p_delivery_fee sent from checkout UI.
create or replace function public.create_checkout_order(
  p_customer jsonb,
  p_shipping_address jsonb,
  p_items jsonb,
  p_payment_method text default 'cash_on_delivery',
  p_delivery_method text default 'standard_delivery',
  p_coupon_code text default null,
  p_gift jsonb default '{}'::jsonb,
  p_delivery_fee numeric default null
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
  v_zone record;
  v_payment_status public.payment_status := 'unpaid';
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into public.customers (full_name, email, phone)
  values (p_customer->>'full_name', lower(p_customer->>'email'), p_customer->>'phone')
  on conflict (email, phone) do update set full_name = excluded.full_name, updated_at = now()
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
  elsif p_delivery_fee is not null then
    v_delivery := greatest(p_delivery_fee, 0);
  else
    select * into v_zone
    from public.delivery_zones dz
    where dz.is_active = true
      and lower(dz.country) = lower(coalesce(p_shipping_address->>'country', 'Lebanon'))
      and lower(dz.city) = lower(coalesce(p_shipping_address->>'city', ''))
      and (dz.area is null or lower(dz.area) = lower(coalesce(p_shipping_address->>'area', '')))
    order by case when dz.area is null then 1 else 0 end
    limit 1;

    if found then
      if p_delivery_method = 'same_day_delivery' then
        v_delivery := v_zone.same_day_fee;
      else
        v_delivery := v_zone.delivery_fee;
      end if;
    elsif p_delivery_method = 'same_day_delivery' then
      v_delivery := 6;
    else
      v_delivery := 3;
    end if;
  end if;

  if p_payment_method = 'cash_on_delivery' then
    v_payment_status := 'cod_pending';
  else
    v_payment_status := 'unpaid';
  end if;

  insert into public.orders (customer_id, shipping_address_id, payment_method, payment_status, delivery_method, order_status, gift_wrap, gift_message, customer_notes)
  values (v_customer_id, v_address_id, p_payment_method, v_payment_status, p_delivery_method, 'confirmed', coalesce((p_gift->>'gift_wrap')::boolean, false), p_gift->>'gift_message', p_shipping_address->>'notes')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := greatest((v_item->>'quantity')::int, 1);

    select pv.id, pv.product_id, pv.sku, pv.size_ml, pv.concentration, pv.price, pv.stock_quantity, p.name as product_name, p.status as product_status, b.name as brand_name
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    left join public.brands b on b.id = p.brand_id
    where pv.id = v_variant_id
    for update of pv;

    if not found then raise exception 'Product variant not found'; end if;
    if v_variant.product_status <> 'active' then raise exception 'Product % is not active', v_variant.product_name; end if;
    if v_variant.stock_quantity < v_qty then raise exception 'Insufficient stock for %. Available: %', v_variant.product_name, v_variant.stock_quantity; end if;

    update public.product_variants
    set stock_quantity = stock_quantity - v_qty, reserved_quantity = reserved_quantity + v_qty, updated_at = now()
    where id = v_variant_id;

    insert into public.order_items (order_id, product_id, variant_id, brand_name, product_name, sku, size_ml, concentration, quantity, unit_price, total_price)
    values (v_order_id, v_variant.product_id, v_variant.id, coalesce(v_variant.brand_name, 'Maison'), v_variant.product_name, v_variant.sku, v_variant.size_ml, v_variant.concentration, v_qty, v_variant.price, v_variant.price * v_qty);

    insert into public.inventory_movements (variant_id, movement_type, quantity, reference_type, reference_id, notes)
    values (v_variant_id, 'sale_reserve', -v_qty, 'order', v_order_id, 'Reserved during ecommerce checkout');

    v_subtotal := v_subtotal + (v_variant.price * v_qty);
  end loop;

  if v_zone.free_delivery_minimum is not null and v_subtotal >= v_zone.free_delivery_minimum then
    v_delivery := 0;
  end if;

  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    select * into v_coupon
    from public.coupons
    where lower(code) = lower(trim(p_coupon_code)) and is_active = true
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
  set subtotal_amount = v_subtotal, discount_amount = v_discount, delivery_fee = v_delivery, total_amount = v_total, coupon_code = nullif(trim(coalesce(p_coupon_code, '')), ''), updated_at = now()
  where id = v_order_id;

  insert into public.payments (order_id, payment_method, payment_status, amount)
  values (v_order_id, p_payment_method, v_payment_status, v_total);

  insert into public.shipments (order_id, delivery_status)
  values (v_order_id, 'pending');

  insert into public.order_status_history (order_id, status, note)
  values (v_order_id, 'confirmed', 'Order created from ecommerce checkout');

  return query select o.id, o.order_number, o.total_amount from public.orders o where o.id = v_order_id;
end;
$$;
