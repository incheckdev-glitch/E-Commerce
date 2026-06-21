import { AdminNav } from '@/components/AdminNav';
import { ProductCreateForm } from '@/components/ProductCreateForm';
import { ProductImageUploadForm } from '@/components/ProductImageUploadForm';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';
import { setProductStatus, softDeleteProduct, updateProductBasics, updateVariantBasics } from '@/app/actions/admin-products';

function AdminError({ message }: { message: string }) {
  return (
    <main className="section">
      <div className="container"><div className="notice"><strong>Products page error:</strong> {message}</div></div>
    </main>
  );
}

export default async function AdminProductsPage() {
  const access = await requireAdmin();
  if (!access.ok) {
    return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;
  }

  try {
    const supabase = createAdminClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('*, brands(name), categories(name), product_images(image_url,is_primary), product_variants(id,sku,size_ml,price,compare_at_price,stock_quantity,low_stock_threshold,is_active)')
      .order('created_at', { ascending: false });

    if (error) return <AdminError message={error.message} />;

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title"><div><h1>Products</h1><p>Create, edit, upload images, update price/stock, hide, or discontinue perfume products.</p></div></div>
            <ProductCreateForm />
            <div className="section">
              <h2>Current Products</h2>
              <div className="admin-stack">
                {(products || []).map((product: any) => {
                  const brandName = Array.isArray(product.brands) ? product.brands[0]?.name || '-' : product.brands?.name || '-';
                  const imageUrl = product.product_images?.find((image: any) => image.is_primary)?.image_url || product.product_images?.[0]?.image_url || '/placeholder.svg';
                  return (
                    <article className="panel admin-product-card" key={product.id}>
                      <div className="admin-product-head">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt={product.name} />
                        <div>
                          <h3>{product.name}</h3>
                          <p className="muted">{brandName} · /{product.slug} · {product.gender} · {product.concentration}</p>
                          <span className={`status ${product.status === 'active' ? 'green' : product.status === 'discontinued' ? 'red' : ''}`}>{product.status}</span>
                        </div>
                      </div>

                      <div className="admin-two-col">
                        <form action={updateProductBasics.bind(null, product.id)} className="mini-panel">
                          <h4>Edit product details</h4>
                          <div className="form-grid">
                            <div className="form-row"><label>Name</label><input className="input" name="name" defaultValue={product.name} required /></div>
                            <div className="form-row"><label>Scent family</label><input className="input" name="scentFamily" defaultValue={product.scent_family || ''} /></div>
                            <div className="form-row"><label>Top notes</label><input className="input" name="topNotes" defaultValue={product.top_notes || ''} /></div>
                            <div className="form-row"><label>Heart notes</label><input className="input" name="heartNotes" defaultValue={product.heart_notes || ''} /></div>
                            <div className="form-row"><label>Base notes</label><input className="input" name="baseNotes" defaultValue={product.base_notes || ''} /></div>
                            <div className="form-row"><label>Occasion</label><input className="input" name="occasion" defaultValue={product.occasion || ''} /></div>
                            <div className="form-row"><label>Season</label><input className="input" name="season" defaultValue={product.season || ''} /></div>
                          </div>
                          <div className="form-row" style={{ marginTop: 12 }}><label>Description</label><textarea className="textarea" name="description" defaultValue={product.description || ''} /></div>
                          <button className="btn secondary" type="submit" style={{ marginTop: 12 }}>Save Product</button>
                        </form>

                        <div className="mini-panel">
                          <h4>Images and status</h4>
                          <ProductImageUploadForm productId={product.id} />
                          <form action={setProductStatus.bind(null, product.id)} className="mini-form" style={{ marginTop: 12 }}>
                            <select className="select" name="status" defaultValue={product.status}>
                              <option value="draft">Draft</option>
                              <option value="active">Active</option>
                              <option value="hidden">Hidden</option>
                              <option value="discontinued">Discontinued</option>
                            </select>
                            <button className="btn secondary" type="submit">Update Status</button>
                          </form>
                          <form action={softDeleteProduct.bind(null, product.id)} style={{ marginTop: 12 }}>
                            <button className="btn danger" type="submit">Discontinue Product</button>
                          </form>
                        </div>
                      </div>

                      <div className="section" style={{ paddingBottom: 0 }}>
                        <h4>Variants</h4>
                        <div className="variant-admin-grid">
                          {(product.product_variants || []).map((variant: any) => (
                            <form action={updateVariantBasics.bind(null, variant.id)} className="mini-panel" key={variant.id}>
                              <strong>{variant.size_ml}ml</strong>
                              <p className="muted">{variant.sku}</p>
                              <div className="form-grid">
                                <div className="form-row"><label>Price</label><input className="input" name="price" type="number" step="0.01" defaultValue={variant.price} /></div>
                                <div className="form-row"><label>Compare at</label><input className="input" name="compareAtPrice" type="number" step="0.01" defaultValue={variant.compare_at_price || ''} /></div>
                                <div className="form-row"><label>Stock</label><input className="input" name="stockQuantity" type="number" defaultValue={variant.stock_quantity} /></div>
                                <div className="form-row"><label>Low stock alert</label><input className="input" name="lowStockThreshold" type="number" defaultValue={variant.low_stock_threshold || 5} /></div>
                              </div>
                              <button className="btn secondary" type="submit" style={{ marginTop: 12 }}>Save Variant</button>
                            </form>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!(products || []).length ? <div className="notice">No products yet.</div> : null}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error: any) {
    return <AdminError message={error?.message || String(error)} />;
  }
}
