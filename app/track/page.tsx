import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';

function mask(value?: string | null) {
  if (!value) return '-';
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

export default async function TrackOrderPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) || {};
  const orderNumber = String(params.order || '').trim();
  const contact = String(params.contact || '').trim().toLowerCase();
  let result: any = null;
  let message = '';

  if (orderNumber && contact) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*,customers(full_name,email,phone),addresses(city,area,street),shipments(courier_name,tracking_number,delivery_status),order_items(quantity,product_name,brand_name,size_ml)')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) message = error.message;
      else if (!data) message = 'Order not found.';
      else {
        const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
        const email = String(customer?.email || '').toLowerCase();
        const phone = String(customer?.phone || '').toLowerCase();
        if (email === contact || phone === contact) result = data;
        else message = 'The email or phone does not match this order.';
      }
    } catch (error: any) {
      message = error?.message || 'Unable to track order.';
    }
  }

  const customer = result ? (Array.isArray(result.customers) ? result.customers[0] : result.customers) : null;
  const address = result ? (Array.isArray(result.addresses) ? result.addresses[0] : result.addresses) : null;
  const shipment = result ? (Array.isArray(result.shipments) ? result.shipments[0] : result.shipments) : null;

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Track Order</span>
          <h1>Order Tracking</h1>
          <p>Enter your order number and the same email or phone used during checkout.</p>
        </div>
      </section>

      <section className="section">
        <div className="container detail-grid">
          <form className="panel">
            <h2>Find Your Order</h2>
            <div className="form-row"><label>Order number</label><input className="input" name="order" defaultValue={orderNumber} placeholder="ORD-2026-000001" required /></div>
            <div className="form-row" style={{ marginTop: 12 }}><label>Email or phone</label><input className="input" name="contact" defaultValue={contact} placeholder="email@example.com or phone" required /></div>
            <button className="btn" type="submit" style={{ marginTop: 14 }}>Track Order</button>
            {message ? <p className="notice" style={{ marginTop: 14 }}>{message}</p> : null}
          </form>

          <aside className="panel">
            <h2>Status</h2>
            {result ? (
              <div>
                <div className="badge-row"><span className="status green">{result.order_status}</span><span className="status">{result.payment_status}</span><span className="status">{shipment?.delivery_status || 'pending'}</span></div>
                <table className="table" style={{ marginTop: 16 }}>
                  <tbody>
                    <tr><th>Order</th><td>{result.order_number}</td></tr>
                    <tr><th>Customer</th><td>{customer?.full_name || '-'}<div className="muted">{mask(customer?.email)} · {mask(customer?.phone)}</div></td></tr>
                    <tr><th>Delivery</th><td>{address?.city || '-'}, {address?.area || '-'}<div className="muted">Courier: {shipment?.courier_name || '-'} · Tracking: {shipment?.tracking_number || '-'}</div></td></tr>
                    <tr><th>Total</th><td>{formatMoney(result.total_amount)}</td></tr>
                    <tr><th>Items</th><td>{(result.order_items || []).map((item: any) => <div key={`${item.product_name}-${item.size_ml}`}>{item.brand_name} {item.product_name} {item.size_ml}ml × {item.quantity}</div>)}</td></tr>
                  </tbody>
                </table>
              </div>
            ) : <p className="muted">Your tracking details will appear here.</p>}
          </aside>
        </div>
      </section>
    </main>
  );
}
