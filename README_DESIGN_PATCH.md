# L&C Perfume Luxury Design Patch

This patch updates the ecommerce UI to match the uploaded L&C Perfume brand direction:

- Black / champagne gold / bronze luxury palette
- L&C logo added to `/public/lc-logo.jpeg`
- Premium homepage with hero, categories, best sellers, story, testimonials, newsletter, and footer
- Updated header navigation with cart/account/search icons
- Updated product cards, shop page, and product detail styling
- Admin pages remain functional with the same routes and dark luxury theme

## Files changed

- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/shop/page.tsx`
- `app/product/[slug]/page.tsx`
- `components/Header.tsx`
- `components/ProductCard.tsx`
- `public/lc-logo.jpeg`

## Deploy

Replace these files in your GitHub project, then run:

```bash
git add .
git commit -m "Apply L&C Perfume luxury design"
git push
```

Vercel will redeploy automatically.
