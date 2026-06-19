import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, gender, scent_family, brands(name), product_images(image_url,is_primary), product_variants(id,price,stock_quantity)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge">Perfume ecommerce MVP</span>
            <h1>Sell perfumes online with stock, checkout, and admin flow.</h1>
            <p>
              This starter is prepared for Supabase, Vercel, and GitHub. It includes perfume variants,
              scent notes, inventory, checkout, orders, and an admin structure.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link className="btn" href="/shop">Start Shopping</Link>
              <Link className="btn secondary" href="/admin">Open Admin</Link>
            </div>
          </div>
          <div className="hero-card">
            <h2 style={{ marginTop: 0 }}>MVP flow included</h2>
            <p className="muted">Product catalog → cart → checkout → order creation → stock reservation → admin order management.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {['Women, Men, Unisex categories', '30ml / 50ml / 100ml variants', 'EDT / EDP / Parfum concentration', 'Top, heart, and base notes', 'Gift wrap and sample-ready data model'].map((item) => (
                <div className="notice" key={item}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title">
            <div>
              <h2>New Arrivals</h2>
              <p>Latest active perfumes from Supabase.</p>
            </div>
            <Link href="/shop" className="btn secondary">View all</Link>
          </div>
          <div className="grid">
            {(products || []).map((product: any) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
