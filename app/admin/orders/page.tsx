import { AdminNav } from '@/components/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';
import { updateOrderInternalNote, updateOrderStatus, updatePaymentStatus } from '@/app/actions/admin-orders';

const orderStatuses = ['pending_payment','confirmed','processing','packing','ready_for_pickup','shipped','out_for_delivery','delivered','cancelled','return_requested','returned','refunded'];
const paymentStatuses = ['unpaid','cod_pending','paid','failed','partially_refunded','refunded'];

function AdminError({ message }: { message: string }) {
  return (
    <main className="section">
      <div className="container"><div className="notice"><strong>Orders page error:</strong> {message}</div></div>
    </main>
  );
}

export default async function AdminOrdersPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) || {};
  const access = await requireAdmin();
  if (!access.ok) {
    return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;
  }

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers(full_name,email,phone),
        addresses(country,city,area,street,building,floor),
        shipments(courier_name,tracking_number,delivery_status),
        order_items(quantity,unit_price,total_price,product_name,brand_name,size_ml,concentration)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (params.status) query = query.eq('order_status', params.status);
    if (params.payment) query = query.eq('payment_status', params.payment);

    const { data: orders, error } = await query;

    if (error) return <AdminError message={error.message} />;

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title"><div><h1>Orders</h1><p>Manage status, payments, packing, delivery, customer details, and internal notes.</p></div></div>
            <form className="filters luxury-filters">
              <input className="input" name="q" placeholder="Search is coming next" disabled />
              <select className="select" name="status" defaultValue={params.status || ''}>
                <option value="">All order statuses</option>
                {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select className="select" name="payment" defaultValue={params.payment || ''}>
                <option value="">All payment statuses</option>
                {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button className="btn" type="submit">Filter</button>
              <a className="btn secondary" href="/admin/orders">Reset</a>
            </form>

            <div className="admin-stack">
              {(orders || []).map((order: any) => {
                const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                const address = Array.isArray(order.addresses) ? order.addresses[0] : order.addresses;
                const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
                return (
                  <article className="panel order-admin-card" key={order.id}>
                    <div className="admin-product-head">
                      <div>
                        <h3>{order.order_number}</h3>
                        <p className="muted">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="badge-row">
                        <span className="status">{order.order_status}</span>
                        <span className="status">{order.payment_status}</span>
                        {order.coupon_code ? <span className="status green">{order.coupon_code}</span> : null}
                      </div>
                    </div>

                    <div className="order-grid">
                      <div>
                        <h4>Customer</h4>
                        <p>{customer?.full_name || '-'}</p>
                        <p className="muted">{customer?.phone || '-'}<br />{customer?.email || '-'}</p>
                        <h4>Address</h4>
                        <p>{address?.city || '-'}, {address?.area || '-'}</p>
                        <p className="muted">{address?.street || '-'} {address?.building || ''} {address?.floor || ''}</p>
                      </div>

                      <div>
                        <h4>Items</h4>
                        {(order.order_items || []).map((item: any) => <p key={`${order.id}-${item.product_name}-${item.size_ml}`}>{item.brand_name} {item.product_name} {item.size_ml}ml × {item.quantity}</p>)}
                        <h4>Delivery</h4>
                        <p>{order.delivery_method}</p>
                        <p className="muted">Courier: {shipment?.courier_name || '-'}<br />Tracking: {shipment?.tracking_number || '-'}<br />Status: {shipment?.delivery_status || '-'}</p>
                      </div>

                      <div>
                        <h4>Total</h4>
                        <p><strong>{formatMoney(order.total_amount)}</strong></p>
                        <p className="muted">Subtotal: {formatMoney(order.subtotal_amount || 0)}<br />Delivery: {formatMoney(order.delivery_fee || 0)}<br />Discount: -{formatMoney(order.discount_amount || 0)}</p>
                      </div>
                    </div>

                    <div className="admin-two-col">
                      <form action={updateOrderStatus.bind(null, order.id, order.order_status)} className="mini-panel">
                        <h4>Update order status</h4>
                        <select className="select" name="orderStatus" defaultValue={order.order_status}>
                          {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <input className="input" name="statusNote" placeholder="Optional status note" />
                        <button className="btn secondary" type="submit">Save Status</button>
                      </form>

                      <form action={updatePaymentStatus.bind(null, order.id, order.payment_status)} className="mini-panel">
                        <h4>Update payment</h4>
                        <select className="select" name="paymentStatus" defaultValue={order.payment_status}>
                          {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <button className="btn secondary" type="submit">Save Payment</button>
                      </form>
                    </div>

                    <form action={updateOrderInternalNote.bind(null, order.id)} className="mini-panel" style={{ marginTop: 14 }}>
                      <h4>Internal note</h4>
                      <textarea className="textarea" name="internalNotes" defaultValue={order.internal_notes || ''} />
                      <button className="btn secondary" type="submit" style={{ marginTop: 12 }}>Save Note</button>
                    </form>
                  </article>
                );
              })}
              {!(orders || []).length ? <div className="notice">No orders found.</div> : null}
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error: any) {
    return <AdminError message={error?.message || String(error)} />;
  }
}
