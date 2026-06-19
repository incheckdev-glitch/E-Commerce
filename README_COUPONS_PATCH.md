# Coupons Patch

Replace the matching files in your GitHub project with these files.

New/updated features:
- Admin Coupons page: `/admin/coupons`
- Create percentage, fixed amount, or free delivery coupons
- Activate/deactivate coupons
- Checkout coupon apply button
- Checkout total preview with discount
- Server-side coupon validation before order creation
- Orders page shows coupon, discount, subtotal, delivery, and total

Database:
- If you already ran `supabase/full_setup.sql`, you probably do not need to run anything.
- If `/admin/coupons` says the coupons table does not exist, run `supabase/coupon_patch.sql` in Supabase SQL Editor.

After replacing files:

```bash
git add .
git commit -m "Add coupons management and checkout coupon apply"
git push
```

Then wait for Vercel to redeploy.
