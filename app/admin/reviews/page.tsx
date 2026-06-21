import { AdminNav } from '@/components/AdminNav';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { setReviewApproval } from '@/app/actions/admin-reviews';

function AdminError({ message }: { message: string }) {
  return <main className="section"><div className="container"><div className="notice"><strong>Reviews page error:</strong> {message}</div></div></main>;
}

export default async function AdminReviewsPage() {
  const access = await requireAdmin();
  if (!access.ok) return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;

  try {
    const supabase = createAdminClient();
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id,rating,longevity_rating,sillage_rating,title,comment,is_approved,created_at,products(name,slug,brands(name)),customers(full_name,email),orders(order_number)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return <AdminError message={error.message} />;

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title"><div><h1>Reviews</h1><p>Approve or hide customer reviews before they appear on product pages.</p></div></div>
            <table className="table">
              <thead><tr><th>Product</th><th>Review</th><th>Ratings</th><th>Customer</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {(reviews || []).map((review: any) => {
                  const product = Array.isArray(review.products) ? review.products[0] : review.products;
                  const brand = Array.isArray(product?.brands) ? product.brands[0] : product?.brands;
                  const customer = Array.isArray(review.customers) ? review.customers[0] : review.customers;
                  const order = Array.isArray(review.orders) ? review.orders[0] : review.orders;
                  return (
                    <tr key={review.id}>
                      <td>{brand?.name || 'L&C Perfume'} {product?.name || '-'}<div className="muted">/{product?.slug || '-'}</div></td>
                      <td><strong>{review.title || 'Customer review'}</strong><div className="muted">{review.comment}</div><div className="muted">{new Date(review.created_at).toLocaleString()}</div></td>
                      <td>Stars: {review.rating}/5<br />Longevity: {review.longevity_rating || '-'}/5<br />Sillage: {review.sillage_rating || '-'}/5</td>
                      <td>{customer?.full_name || '-'}<div className="muted">{customer?.email || ''}<br />{order?.order_number || ''}</div></td>
                      <td><span className={`status ${review.is_approved ? 'green' : 'red'}`}>{review.is_approved ? 'approved' : 'pending'}</span></td>
                      <td>
                        <form action={setReviewApproval.bind(null, review.id, !review.is_approved)}>
                          <button className="btn secondary" type="submit">{review.is_approved ? 'Hide' : 'Approve'}</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {!(reviews || []).length ? <tr><td colSpan={6}>No reviews yet.</td></tr> : null}
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
