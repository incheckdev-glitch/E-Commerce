import { AdminNav } from '@/components/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';
import { adjustVariantStock } from '@/app/actions/admin-inventory';

function AdminError({ message }: { message: string }) {
  return <main className="section"><div className="container"><div className="notice"><strong>Inventory page error:</strong> {message}</div></div></main>;
}

export default async function InventoryPage() {
  const access = await requireAdmin();
  if (!access.ok) return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;

  try {
    const supabase = createAdminClient();
    const [variantsResult, movementsResult] = await Promise.all([
      supabase
        .from('product_variants')
        .select('id,sku,size_ml,price,cost_price,stock_quantity,reserved_quantity,low_stock_threshold,batch_number,expiry_date,products(name,brands(name))')
        .order('stock_quantity', { ascending: true })
        .limit(100),
      supabase
        .from('inventory_movements')
        .select('id,quantity,movement_type,notes,created_at,product_variants(sku,size_ml,products(name))')
        .order('created_at', { ascending: false })
        .limit(25)
    ]);

    const firstError = variantsResult.error || movementsResult.error;
    if (firstError) return <AdminError message={firstError.message} />;

    const variants = variantsResult.data || [];
    const movements = movementsResult.data || [];
    const totalStock = variants.reduce((sum: number, variant: any) => sum + Number(variant.stock_quantity || 0), 0);
    const stockValue = variants.reduce((sum: number, variant: any) => sum + Number(variant.stock_quantity || 0) * Number(variant.cost_price || variant.price || 0), 0);
    const lowStock = variants.filter((variant: any) => Number(variant.stock_quantity || 0) <= Number(variant.low_stock_threshold || 5));

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title"><div><h1>Inventory</h1><p>Track stock, low-stock alerts, reserved quantities, batches, expiry, and manual adjustments.</p></div></div>
            <div className="kpi-grid">
              <div className="kpi"><span className="muted">Total units</span><strong>{totalStock}</strong></div>
              <div className="kpi"><span className="muted">Low stock SKUs</span><strong>{lowStock.length}</strong></div>
              <div className="kpi"><span className="muted">Estimated stock value</span><strong>{formatMoney(stockValue)}</strong></div>
              <div className="kpi"><span className="muted">Tracked variants</span><strong>{variants.length}</strong></div>
            </div>

            <div className="section">
              <h2>Stock Control</h2>
              <table className="table">
                <thead><tr><th>Product</th><th>SKU</th><th>Size</th><th>Price</th><th>Stock</th><th>Reserved</th><th>Adjust</th></tr></thead>
                <tbody>
                  {variants.map((variant: any) => {
                    const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
                    const isLow = Number(variant.stock_quantity || 0) <= Number(variant.low_stock_threshold || 5);
                    return (
                      <tr key={variant.id}>
                        <td>{product?.name || '-'}<div className="muted">Batch: {variant.batch_number || '-'} · Expiry: {variant.expiry_date || '-'}</div></td>
                        <td>{variant.sku}</td>
                        <td>{variant.size_ml}ml</td>
                        <td>{formatMoney(variant.price)}</td>
                        <td><span className={`status ${isLow ? 'red' : 'green'}`}>{variant.stock_quantity}</span></td>
                        <td>{variant.reserved_quantity || 0}</td>
                        <td>
                          <form action={adjustVariantStock.bind(null, variant.id)} className="mini-form">
                            <input className="input" name="quantityDelta" type="number" placeholder="+5 or -2" />
                            <input className="input" name="notes" placeholder="Reason" />
                            <button className="btn secondary" type="submit">Apply</button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="section">
              <h2>Latest Inventory Movements</h2>
              <table className="table">
                <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Quantity</th><th>Notes</th></tr></thead>
                <tbody>
                  {movements.map((movement: any) => {
                    const variant = Array.isArray(movement.product_variants) ? movement.product_variants[0] : movement.product_variants;
                    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;
                    return (
                      <tr key={movement.id}>
                        <td>{new Date(movement.created_at).toLocaleString()}</td>
                        <td>{product?.name || '-'}<div className="muted">{variant?.sku || ''} {variant?.size_ml ? `${variant.size_ml}ml` : ''}</div></td>
                        <td><span className="status">{movement.movement_type}</span></td>
                        <td>{movement.quantity}</td>
                        <td>{movement.notes || '-'}</td>
                      </tr>
                    );
                  })}
                  {!movements.length ? <tr><td colSpan={5}>No movements yet.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error: any) {
    return <AdminError message={error?.message || String(error)} />;
  }
}
