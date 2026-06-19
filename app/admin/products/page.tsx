import { AdminNav } from '@/components/AdminNav';
import { ProductCreateForm } from '@/components/ProductCreateForm';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';

export default async function AdminProductsPage() {
  const access = await requireAdmin();
  if (!access.ok) {
    return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;
  }

  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, status, gender, brands(name), product_variants(size_ml,price,stock_quantity)')
    .order('created_at', { ascending: false });

  return (
    <main className="section">
      <div className="container admin-shell">
        <AdminNav />
        <section>
          <div className="section-title"><div><h1>Products</h1><p>Create perfume products and variants.</p></div></div>
          <ProductCreateForm />
          <div className="section">
            <h2>Current Products</h2>
            <table className="table">
              <thead><tr><th>Product</th><th>Brand</th><th>Status</th><th>Variants</th></tr></thead>
              <tbody>
                {(products || []).map((product: any) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong><div className="muted">/{product.slug}</div></td>
                    <td>{product.brands?.name || '-'}</td>
                    <td><span className="status green">{product.status}</span></td>
                    <td>{product.product_variants?.map((v: any) => `${v.size_ml}ml ${formatMoney(v.price)} (${v.stock_quantity})`).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
