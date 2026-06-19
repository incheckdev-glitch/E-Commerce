import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';
import { ClearCartOnMount } from '@/components/ClearCartOnMount';

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(full_name,email,phone), addresses(country,city,area,street,building,floor), order_items(product_name,brand_name,size_ml,concentration,quantity,unit_price,total_price)')
    .eq('order_number', orderNumber)
    .single();

  if (!order) {
    return <main className="section">
      <ClearCartOnMount /><div className="container"><div className="notice">Order not found.</div></div></main>;
  }

  return (
    <main className="section">
      <div className="container detail-grid">
        <section className="panel">
          <h1>Order Confirmed</h1>
          <p className="muted">Thank you {order.customers?.full_name}. Your order has been received.</p>
          <table className="table">
            <tbody>
              <tr><th>Order number</th><td>{order.order_number}</td></tr>
              <tr><th>Order status</th><td><span className="status green">{order.order_status}</span></td></tr>
              <tr><th>Payment status</th><td><span className="status">{order.payment_status}</span></td></tr>
              <tr><th>Total</th><td>{formatMoney(order.total_amount)}</td></tr>
              <tr><th>Delivery</th><td>{order.delivery_method}</td></tr>
            </tbody>
          </table>
          <p><Link href="/shop" className="btn">Continue shopping</Link></p>
        </section>
        <aside className="panel">
          <h2>Items</h2>
          <table className="table">
            <tbody>
              {order.order_items?.map((item: any) => (
                <tr key={`${item.product_name}-${item.size_ml}`}>
                  <td>{item.brand_name} {item.product_name}<div className="muted">{item.size_ml}ml · {item.concentration} × {item.quantity}</div></td>
                  <td>{formatMoney(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>
    </main>
  );
}
