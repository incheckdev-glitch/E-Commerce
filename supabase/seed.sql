-- Demo perfume data. Run after schema.sql.

insert into public.brands (name, slug, country_of_origin, description)
values
  ('Maison Oud', 'maison-oud', 'Lebanon', 'Warm oud and amber perfume line.'),
  ('Cedar Bloom', 'cedar-bloom', 'Lebanon', 'Fresh floral and cedar inspired scents.'),
  ('Amber Atelier', 'amber-atelier', 'France', 'Luxury amber and vanilla perfumes.')
on conflict (slug) do nothing;

insert into public.categories (name, slug, description)
values
  ('Women Perfume', 'women-perfume', 'Perfumes curated for women.'),
  ('Men Perfume', 'men-perfume', 'Perfumes curated for men.'),
  ('Unisex Perfume', 'unisex-perfume', 'Shared signature perfumes.'),
  ('Gift Sets', 'gift-sets', 'Perfume gifts and bundles.'),
  ('Samples', 'samples', 'Small perfume samples and discovery sets.')
on conflict (slug) do nothing;

with data as (
  select
    'Oud Velvet'::text as name,
    'oud-velvet'::text as slug,
    'maison-oud'::text as brand_slug,
    'unisex-perfume'::text as category_slug,
    'unisex'::public.product_gender as gender,
    'EDP'::text as concentration,
    'Oud, amber, woody'::text as scent_family,
    'A rich unisex oud perfume with amber warmth and soft musk.'::text as description,
    'Saffron, bergamot'::text as top_notes,
    'Oud, rose'::text as heart_notes,
    'Amber, musk, sandalwood'::text as base_notes,
    'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80'::text as image_url
  union all select
    'Cedar Rose', 'cedar-rose', 'cedar-bloom', 'women-perfume', 'women', 'EDP', 'Floral, fresh, cedar',
    'A bright rose perfume with clean cedar and soft white musk.', 'Mandarin, pear', 'Rose, jasmine', 'Cedar, musk',
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80'
  union all select
    'Amber Night', 'amber-night', 'amber-atelier', 'men-perfume', 'men', 'Parfum', 'Amber, spicy, vanilla',
    'A long-lasting evening perfume with amber, spice, and vanilla.', 'Pink pepper, cardamom', 'Amber, cinnamon', 'Vanilla, tonka, woods',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80'
)
insert into public.products (
  brand_id, category_id, name, slug, gender, concentration, scent_family, description,
  top_notes, heart_notes, base_notes, occasion, season, ingredients, country_of_origin,
  sample_available, tester_available, gift_wrap_available, is_returnable, has_shipping_restriction, status
)
select
  b.id, c.id, d.name, d.slug, d.gender, d.concentration, d.scent_family, d.description,
  d.top_notes, d.heart_notes, d.base_notes, 'Daily and evening', 'All season', 'Alcohol denat., parfum/fragrance, aqua/water', b.country_of_origin,
  true, true, true, true, true, 'active'
from data d
join public.brands b on b.slug = d.brand_slug
join public.categories c on c.slug = d.category_slug
on conflict (slug) do nothing;

insert into public.product_images (product_id, image_url, alt_text, is_primary)
select p.id, d.image_url, p.name, true
from public.products p
join (
  values
    ('oud-velvet', 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80'),
    ('cedar-rose', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80'),
    ('amber-night', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80')
) as d(slug, image_url) on d.slug = p.slug
where not exists (select 1 from public.product_images pi where pi.product_id = p.id);

insert into public.product_variants (product_id, sku, size_ml, concentration, cost_price, price, compare_at_price, stock_quantity, low_stock_threshold, weight_grams, batch_number, expiry_date)
select p.id, p.slug || '-50', 50, p.concentration, 28, 65, 75, 12, 4, 220, 'BATCH-2026-A', '2029-12-31'
from public.products p
where not exists (select 1 from public.product_variants v where v.sku = p.slug || '-50');

insert into public.product_variants (product_id, sku, size_ml, concentration, cost_price, price, compare_at_price, stock_quantity, low_stock_threshold, weight_grams, batch_number, expiry_date)
select p.id, p.slug || '-100', 100, p.concentration, 45, 110, 130, 8, 4, 360, 'BATCH-2026-B', '2029-12-31'
from public.products p
where not exists (select 1 from public.product_variants v where v.sku = p.slug || '-100');

insert into public.coupons (code, description, discount_type, discount_value, minimum_order_amount, max_uses, starts_at, ends_at, is_active)
values
  ('WELCOME10', '10% first order discount', 'percentage', 10, 50, 500, now() - interval '1 day', now() + interval '1 year', true),
  ('FREEDELIVERY', 'Free delivery discount', 'free_delivery', 0, 75, 500, now() - interval '1 day', now() + interval '1 year', true)
on conflict (code) do nothing;
