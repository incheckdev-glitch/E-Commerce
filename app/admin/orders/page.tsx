import { AdminNav } from '@/components/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';

export default async function AdminOrdersPage() {
  const access = await requireAdmin();
  if (!access.ok) {
    return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;
  }

  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      customers(full_name,email,phone),
      addresses(country,city,area,street,building,floor),
      order_items(quantity,unit_price,total_price,product_name,brand_name,size_ml,concentration)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <main className="section">
      <div className="container admin-shell">
        <AdminNav />
        <section>
          <div className="section-title"><div><h1>Orders</h1><p>Customer orders, payment, delivery, and items.</p></div></div>
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Address</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {(orders || []).map((order: any) => (
                <tr key={order.id}>
                  <td><strong>{order.order_number}</strong><div className="muted">{new Date(order.created_at).toLocaleString()}</div></td>
                  <td>{order.customers?.full_name}<div className="muted">{order.customers?.phone}<br />{order.customers?.email}</div></td>
                  <td>{order.addresses?.city}, {order.addresses?.area}<div className="muted">{order.addresses?.street}</div></td>
                  <td>{order.order_items?.map((item: any) => <div key={`${order.id}-${item.product_name}-${item.size_ml}`}>{item.brand_name} {item.product_name} {item.size_ml}ml × {item.quantity}</div>)}</td>
                  <td>{formatMoney(order.total_amount)}</td>
                  <td><span className="status">{order.order_status}</span><br /><span className="status">{order.payment_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
