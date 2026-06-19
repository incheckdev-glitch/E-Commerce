import { AdminNav } from '@/components/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';

function AdminError({ message }: { message: string }) {
  return (
    <main className="section">
      <div className="container"><div className="notice"><strong>Orders page error:</strong> {message}</div></div>
    </main>
  );
}

export default async function AdminOrdersPage() {
  const access = await requireAdmin();
  if (!access.ok) {
    return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;
  }

  try {
    const supabase = createAdminClient();
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(full_name,email,phone),
        addresses(country,city,area,street,building,floor),
        order_items(quantity,unit_price,total_price,product_name,brand_name,size_ml,concentration)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return <AdminError message={error.message} />;

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title"><div><h1>Orders</h1><p>Customer orders, payment, delivery, and items.</p></div></div>
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Address</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {(orders || []).map((order: any) => {
                  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                  const address = Array.isArray(order.addresses) ? order.addresses[0] : order.addresses;
                  return (
                    <tr key={order.id}>
                      <td><strong>{order.order_number}</strong><div className="muted">{new Date(order.created_at).toLocaleString()}</div></td>
                      <td>{customer?.full_name || '-'}<div className="muted">{customer?.phone || '-'}<br />{customer?.email || '-'}</div></td>
                      <td>{address?.city || '-'}, {address?.area || '-'}<div className="muted">{address?.street || '-'}</div></td>
                      <td>{(order.order_items || []).map((item: any) => <div key={`${order.id}-${item.product_name}-${item.size_ml}`}>{item.brand_name} {item.product_name} {item.size_ml}ml × {item.quantity}</div>)}</td>
                      <td>{formatMoney(order.total_amount)}</td>
                      <td><span className="status">{order.order_status}</span><br /><span className="status">{order.payment_status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    );
  } catch (error: any) {
    return <AdminError message={error?.message || String(error)} />;
  }
}
