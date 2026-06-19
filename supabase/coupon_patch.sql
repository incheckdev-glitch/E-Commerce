-- Coupon patch for existing perfume ecommerce Supabase projects.
-- Run only if your coupons table is missing. If you already ran full_setup.sql, this is safe to run again.

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

alter table public.coupons enable row level security;

do $$ begin
  create policy "Admin full access coupons" on public.coupons
  for all using (public.is_admin_user()) with check (public.is_admin_user());
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on public.coupons to authenticated;
grant select, insert, update, delete on public.coupons to service_role;
