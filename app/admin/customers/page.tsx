import { AdminNav } from '@/components/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';

function AdminError({ message }: { message: string }) {
  return <main className="section"><div className="container"><div className="notice"><strong>Customers page error:</strong> {message}</div></div></main>;
}

export default async function CustomersPage() {
  const access = await requireAdmin();
  if (!access.ok) return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;

  try {
    const supabase = createAdminClient();
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id,full_name,email,phone,preferred_scent_family,marketing_consent,created_at,orders(order_number,total_amount,order_status,created_at)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return <AdminError message={error.message} />;

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title"><div><h1>Customers</h1><p>View customer profiles, order history, spend, scent preference, and marketing consent.</p></div></div>
            <table className="table">
              <thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Total Spend</th><th>Latest Order</th><th>Preference</th></tr></thead>
              <tbody>
                {(customers || []).map((customer: any) => {
                  const orders = customer.orders || [];
                  const totalSpend = orders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);
                  const latest = orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  return (
                    <tr key={customer.id}>
                      <td><strong>{customer.full_name}</strong><div className="muted">Since {new Date(customer.created_at).toLocaleDateString()}</div></td>
                      <td>{customer.phone || '-'}<div className="muted">{customer.email || '-'}</div></td>
                      <td>{orders.length}</td>
                      <td>{formatMoney(totalSpend)}</td>
                      <td>{latest ? <><strong>{latest.order_number}</strong><div className="muted">{latest.order_status}</div></> : '-'}</td>
                      <td>{customer.preferred_scent_family || '-'}<div className="muted">Marketing: {customer.marketing_consent ? 'yes' : 'no'}</div></td>
                    </tr>
                  );
                })}
                {!(customers || []).length ? <tr><td colSpan={6}>No customers yet.</td></tr> : null}
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
