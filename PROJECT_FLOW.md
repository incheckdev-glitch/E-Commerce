# Perfume Ecommerce Full Flow

## Customer journey

Browse homepage → shop/catalog → filter/search → product details → select size/concentration → add to cart → checkout → order confirmed → warehouse processing → delivery → review/return.

## Product lifecycle

Draft product → active product → stock added → customer checkout reserves stock → order delivered → stock sold → possible return/damage/adjustment.

## Order lifecycle

pending_payment → confirmed → processing → packing → ready_for_pickup/shipped → out_for_delivery → delivered.

Exceptions:

- payment_failed
- cancelled
- return_requested
- returned
- refunded

## Admin modules

- Dashboard
- Products
- Variants
- Inventory
- Orders
- Customers
- Delivery
- Coupons
- Returns
- Reviews
- Suppliers
- Reports
- Settings

## MVP decisions

- Cart is local-storage based.
- Checkout uses a Supabase RPC with server-side service role.
- Product catalog is public read-only through RLS.
- Admin pages require a Supabase Auth user with an admin-style role in `profiles`.
- Stock is reduced and reserved during checkout.
