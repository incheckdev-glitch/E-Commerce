import { AdminNav } from '@/components/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';

function AdminError({ message }: { message: string }) {
  return <main className="section"><div className="container"><div className="notice"><strong>Reports page error:</strong> {message}</div></div></main>;
}

export default async function ReportsPage() {
  const access = await requireAdmin();
  if (!access.ok) return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;

  try {
    const supabase = createAdminClient();
    const [ordersResult, variantsResult, couponsResult] = await Promise.all([
      supabase.from('orders').select('total_amount,discount_amount,order_status,payment_status,created_at'),
      supabase.from('product_variants').select('price,cost_price,stock_quantity'),
      supabase.from('coupons').select('code,used_count')
    ]);

    const firstError = ordersResult.error || variantsResult.error || couponsResult.error;
    if (firstError) return <AdminError message={firstError.message} />;

    const orders = ordersResult.data || [];
    const variants = variantsResult.data || [];
    const coupons = couponsResult.data || [];

    const totalSales = orders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);
    const totalDiscounts = orders.reduce((sum: number, order: any) => sum + Number(order.discount_amount || 0), 0);
    const averageOrder = orders.length ? totalSales / orders.length : 0;
    const stockValue = variants.reduce((sum: number, variant: any) => sum + Number(variant.stock_quantity || 0) * Number(variant.cost_price || variant.price || 0), 0);

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title"><div><h1>Reports</h1><p>Sales, discounts, coupons, and inventory value overview.</p></div></div>
            <div className="kpi-grid">
              <div className="kpi"><span className="muted">Sales</span><strong>{formatMoney(totalSales)}</strong></div>
              <div className="kpi"><span className="muted">Orders</span><strong>{orders.length}</strong></div>
              <div className="kpi"><span className="muted">Average Order</span><strong>{formatMoney(averageOrder)}</strong></div>
              <div className="kpi"><span className="muted">Inventory Value</span><strong>{formatMoney(stockValue)}</strong></div>
            </div>
            <div className="section">
              <table className="table">
                <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                <tbody>
                  <tr><td>Total Discounts Given</td><td>{formatMoney(totalDiscounts)}</td></tr>
                  <tr><td>Paid Orders</td><td>{orders.filter((o: any) => o.payment_status === 'paid').length}</td></tr>
                  <tr><td>Pending COD</td><td>{orders.filter((o: any) => o.payment_status === 'cod_pending').length}</td></tr>
                  <tr><td>Delivered Orders</td><td>{orders.filter((o: any) => o.order_status === 'delivered').length}</td></tr>
                  <tr><td>Coupons Created</td><td>{coupons.length}</td></tr>
                  <tr><td>Total Coupon Usage</td><td>{coupons.reduce((sum: number, coupon: any) => sum + Number(coupon.used_count || 0), 0)}</td></tr>
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
