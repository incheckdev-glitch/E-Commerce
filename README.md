# Perfume Ecommerce Starter

This is a production-oriented MVP starter for a perfume ecommerce platform using:

- Next.js App Router
- Supabase Postgres, Auth, RLS, and RPC checkout
- Vercel deployment
- GitHub source control

## Included flow

Customer side:

1. Homepage
2. Shop/catalog page
3. Product details with perfume-specific data
4. Variant selection by size/concentration
5. Local-storage cart
6. Checkout form
7. Supabase checkout RPC
8. Order confirmation page

Admin side:

1. Login/sign up
2. Admin dashboard
3. Product creation
4. Product list
5. Order list
6. Low-stock alerts

Perfume-specific fields:

- Brand
- Category
- Gender
- Concentration: EDT, EDP, Parfum, etc.
- Size variants: 50ml, 100ml, etc.
- Top notes, heart notes, base notes
- Scent family
- Samples/testers
- Gift wrap
- Batch and expiry date
- Ingredients and allergens
- Shipping restriction flag
- Sealed-only return support

---

## 1. Create Supabase project

1. Create a new Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Copy your Project URL, anon key, and service role key.

Important: keep the `SUPABASE_SERVICE_ROLE_KEY` private. It is used only from server actions.

---

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 4. Create first admin user

1. Go to `/login`.
2. Create an account.
3. In Supabase SQL Editor, run:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where email = 'YOUR_EMAIL_HERE'
  limit 1
);
```

Then login again and open `/admin`.

---

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "Initial perfume ecommerce MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## 6. Deploy to Vercel

1. Import the GitHub repo into Vercel.
2. Add the same environment variables in Vercel Project Settings.
3. Deploy.

For production, set:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## 7. Recommended next features

High priority:

- Real payment gateway integration
- Order status update actions
- Courier assignment
- Product image upload to Supabase Storage
- Product edit/delete screens
- Customer order tracking by email/phone
- Wishlist
- Reviews after delivery
- Return/exchange request form
- WhatsApp/email notifications

Medium priority:

- Loyalty points
- Free samples at checkout
- Gift cards
- Supplier purchase orders
- Accounting reports
- Abandoned cart notifications
- Advanced filters by notes, longevity, season, and occasion

---

## 8. Important production notes

- Do not expose the Supabase service role key in client components.
- Keep checkout writes on server actions or API routes only.
- Keep RLS enabled.
- Perfume can have shipping restrictions because of alcohol content, so international checkout should be blocked until carrier approval is confirmed.
- For returns, use sealed-only return rules unless the product is damaged or incorrect.
