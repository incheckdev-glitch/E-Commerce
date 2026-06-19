import { AdminNav } from '@/components/AdminNav';
import { CouponCreateForm } from '@/components/CouponCreateForm';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';
import { setCouponActive } from '@/app/actions/admin-coupons';

function AdminError({ message }: { message: string }) {
  return (
    <main className="section">
      <div className="container"><div className="notice"><strong>Coupons page error:</strong> {message}</div></div>
    </main>
  );
}

function formatDiscount(coupon: any) {
  if (coupon.discount_type === 'percentage') return `${Number(coupon.discount_value)}%`;
  if (coupon.discount_type === 'fixed') return formatMoney(coupon.discount_value);
  return 'Free delivery';
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default async function AdminCouponsPage() {
  const access = await requireAdmin();
  if (!access.ok) {
    return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;
  }

  try {
    const supabase = createAdminClient();
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return <AdminError message={error.message} />;

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title">
              <div>
                <h1>Coupons</h1>
                <p>Create checkout coupons for percentage discounts, fixed discounts, or free delivery.</p>
              </div>
            </div>

            <CouponCreateForm />

            <div className="section">
              <h2>Current Coupons</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Minimum Order</th>
                    <th>Usage</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(coupons || []).map((coupon: any) => (
                    <tr key={coupon.id}>
                      <td><strong>{coupon.code}</strong><div className="muted">{coupon.description || '-'}</div></td>
                      <td>{formatDiscount(coupon)}</td>
                      <td>{formatMoney(coupon.minimum_order_amount || 0)}</td>
                      <td>{coupon.used_count || 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : ' / unlimited'}</td>
                      <td><span className="muted">From:</span> {formatDate(coupon.starts_at)}<br /><span className="muted">To:</span> {formatDate(coupon.ends_at)}</td>
                      <td><span className={`status ${coupon.is_active ? 'green' : 'red'}`}>{coupon.is_active ? 'active' : 'inactive'}</span></td>
                      <td>
                        <form action={setCouponActive.bind(null, coupon.id, !coupon.is_active)}>
                          <button className="btn secondary" type="submit">{coupon.is_active ? 'Deactivate' : 'Activate'}</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {!(coupons || []).length ? (
                    <tr><td colSpan={7}>No coupons yet.</td></tr>
                  ) : null}
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
