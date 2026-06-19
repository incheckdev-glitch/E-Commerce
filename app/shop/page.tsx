import { ProductCard } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';

export default async function ShopPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) || {};
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('id, slug, name, gender, scent_family, concentration, brands(name), categories(name), product_images(image_url,is_primary), product_variants(id,price,stock_quantity,size_ml)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (params.gender) query = query.eq('gender', params.gender);
  if (params.scent) query = query.ilike('scent_family', `%${params.scent}%`);
  if (params.q) query = query.ilike('name', `%${params.q}%`);

  const { data: products, error } = await query;

  return (
    <main className="section">
      <div className="container">
        <div className="section-title">
          <div>
            <h1>Shop Perfumes</h1>
            <p>Filter by gender, scent family, concentration, brand, and stock.</p>
          </div>
        </div>

        <form className="filters">
          <input className="input" name="q" placeholder="Search perfume name" defaultValue={params.q || ''} />
          <select className="select" name="gender" defaultValue={params.gender || ''}>
            <option value="">All gender</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="unisex">Unisex</option>
          </select>
          <input className="input" name="scent" placeholder="Scent family" defaultValue={params.scent || ''} />
          <button className="btn" type="submit">Filter</button>
          <a className="btn secondary" href="/shop">Reset</a>
        </form>

        {error ? <p className="notice">Supabase error: {error.message}</p> : null}
        <div className="grid">
          {(products || []).map((product: any) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </main>
  );
}
