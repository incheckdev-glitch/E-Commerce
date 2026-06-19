import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AddToCart } from '@/components/AddToCart';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      brands(name),
      categories(name),
      product_images(image_url,is_primary),
      product_variants(id,size_ml,concentration,price,compare_at_price,stock_quantity,sku)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) notFound();

  const imageUrl = product.product_images?.find((image: any) => image.is_primary)?.image_url || product.product_images?.[0]?.image_url || '/placeholder.svg';

  return (
    <main className="section product-detail-section">
      <div className="container detail-grid product-detail-grid">
        <div className="panel product-gallery-panel">
          <span className="product-ribbon">L&C Signature</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="product-img detail-image" src={imageUrl} alt={product.name} />
        </div>
        <div className="product-info-panel">
          <Link href="/shop" className="muted back-link">← Back to shop</Link>
          <span className="eyebrow">{product.brands?.name || 'L&C Perfume'}</span>
          <h1>{product.name}</h1>
          <p className="product-subtitle">{product.gender} · {product.concentration} · {product.scent_family}</p>
          <p className="product-description">{product.description}</p>

          <AddToCart
            product={{ slug: product.slug, name: product.name, brandName: product.brands?.name || 'L&C Perfume', imageUrl }}
            variants={product.product_variants || []}
          />

          <div className="section" style={{ paddingBottom: 0 }}>
            <div className="panel notes-panel">
              <h2>Perfume Notes</h2>
              <table className="table">
                <tbody>
                  <tr><th>Top notes</th><td>{product.top_notes || '-'}</td></tr>
                  <tr><th>Heart notes</th><td>{product.heart_notes || '-'}</td></tr>
                  <tr><th>Base notes</th><td>{product.base_notes || '-'}</td></tr>
                  <tr><th>Scent family</th><td>{product.scent_family || '-'}</td></tr>
                  <tr><th>Occasion</th><td>{product.occasion || '-'}</td></tr>
                  <tr><th>Season</th><td>{product.season || '-'}</td></tr>
                  <tr><th>Gift wrap</th><td>{product.gift_wrap_available ? 'Available' : 'Not available'}</td></tr>
                  <tr><th>Sample</th><td>{product.sample_available ? 'Available' : 'Not available'}</td></tr>
                  <tr><th>Return rule</th><td>{product.is_returnable ? 'Sealed product return allowed' : 'Not returnable'}</td></tr>
                  <tr><th>Shipping restriction</th><td>{product.has_shipping_restriction ? 'Carrier approval required' : 'Normal local delivery'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
