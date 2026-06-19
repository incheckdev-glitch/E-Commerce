import Link from 'next/link';
import { AdminNav } from '@/components/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';

export default async function AdminDashboard() {
  const access = await requireAdmin();
  if (!access.ok) {
    return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;
  }

  const supabase = createAdminClient();
  const [{ count: productCount }, { count: orderCount }, { data: latestOrders }, { data: lowStock }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('order_number,total_amount,order_status,payment_status,created_at,customers(full_name)').order('created_at', { ascending: false }).limit(8),
    supabase.from('product_variants').select('sku,size_ml,stock_quantity,products(name)').lt('stock_quantity', 5).limit(8)
  ]);

  const salesTotal = latestOrders?.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0) || 0;

  return (
    <main className="section">
      <div className="container admin-shell">
        <AdminNav />
        <section>
          <div className="section-title">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Orders, products, stock alerts, and sales overview.</p>
            </div>
            <Link className="btn" href="/admin/products">Manage Products</Link>
          </div>

          <div className="kpi-grid">
            <div className="kpi"><span className="muted">Products</span><strong>{productCount || 0}</strong></div>
            <div className="kpi"><span className="muted">Orders</span><strong>{orderCount || 0}</strong></div>
            <div className="kpi"><span className="muted">Latest orders total</span><strong>{formatMoney(salesTotal)}</strong></div>
            <div className="kpi"><span className="muted">Low stock</span><strong>{lowStock?.length || 0}</strong></div>
          </div>

          <div className="section">
            <h2>Latest Orders</h2>
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead>
              <tbody>
                {(latestOrders || []).map((order: any) => (
                  <tr key={order.order_number}>
                    <td>{order.order_number}</td>
                    <td>{order.customers?.full_name || '-'}</td>
                    <td>{formatMoney(order.total_amount)}</td>
                    <td><span className="status">{order.order_status}</span></td>
                    <td><span className="status">{order.payment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section">
            <h2>Low Stock</h2>
            <table className="table">
              <thead><tr><th>Product</th><th>SKU</th><th>Size</th><th>Stock</th></tr></thead>
              <tbody>
                {(lowStock || []).map((variant: any) => (
                  <tr key={variant.sku}>
                    <td>{variant.products?.name || '-'}</td>
                    <td>{variant.sku}</td>
                    <td>{variant.size_ml}ml</td>
                    <td><span className="status red">{variant.stock_quantity}</span></td>
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
