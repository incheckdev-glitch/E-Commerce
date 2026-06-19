import { ProductCard } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';

export default async function ShopPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) || {};
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('id, slug, name, gender, scent_family, concentration, brands(name), categories(name), product_images(image_url,is_primary), product_variants(id,price,compare_at_price,stock_quantity,size_ml)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (params.gender) query = query.eq('gender', params.gender);
  if (params.scent) query = query.ilike('scent_family', `%${params.scent}%`);
  if (params.q) query = query.ilike('name', `%${params.q}%`);

  const { data: products, error } = await query;

  return (
    <main>
      <section className="page-hero shop-hero">
        <div className="container">
          <span className="eyebrow">L&C Collection</span>
          <h1>Shop Luxury Perfumes</h1>
          <p>Filter by gender, scent family, concentration, brand, and stock to find your signature fragrance.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form className="filters luxury-filters">
            <input className="input" name="q" placeholder="Search perfume name" defaultValue={params.q || ''} />
            <select className="select" name="gender" defaultValue={params.gender || ''}>
              <option value="">All gender</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex</option>
            </select>
            <input className="input" name="scent" placeholder="Scent family: oud, musk, amber" defaultValue={params.scent || ''} />
            <button className="btn" type="submit">Filter</button>
            <a className="btn secondary" href="/shop">Reset</a>
          </form>

          {error ? <p className="notice">Supabase error: {error.message}</p> : null}
          <div className="grid">
            {(products || []).map((product: any) => <ProductCard key={product.id} product={product} />)}
          </div>
          {(!products || products.length === 0) ? <div className="notice">No products found.</div> : null}
        </div>
      </section>
    </main>
  );
}
