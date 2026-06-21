import { AdminNav } from '@/components/AdminNav';
import { DeliveryZoneCreateForm } from '@/components/DeliveryZoneCreateForm';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/currency';
import { updateDeliveryZone } from '@/app/actions/admin-delivery';

function AdminError({ message }: { message: string }) {
  return <main className="section"><div className="container"><div className="notice"><strong>Delivery page error:</strong> {message}</div></div></main>;
}

export default async function DeliveryZonesPage() {
  const access = await requireAdmin();
  if (!access.ok) return <main className="section"><div className="container"><div className="notice">{access.message}</div></div></main>;

  try {
    const supabase = createAdminClient();
    const { data: zones, error } = await supabase.from('delivery_zones').select('*').order('city', { ascending: true });
    if (error) return <AdminError message={error.message} />;

    return (
      <main className="section">
        <div className="container admin-shell">
          <AdminNav />
          <section>
            <div className="section-title"><div><h1>Delivery Zones</h1><p>Control delivery fees by city/area, same-day fee, and free delivery minimum.</p></div></div>
            <DeliveryZoneCreateForm />
            <div className="section">
              <h2>Zones</h2>
              <table className="table">
                <thead><tr><th>Location</th><th>Standard</th><th>Same-day</th><th>Free minimum</th><th>Status</th><th>Edit</th></tr></thead>
                <tbody>
                  {(zones || []).map((zone: any) => (
                    <tr key={zone.id}>
                      <td>{zone.city}<div className="muted">{zone.area || 'All areas'} · {zone.country}</div></td>
                      <td>{formatMoney(zone.delivery_fee)}</td>
                      <td>{formatMoney(zone.same_day_fee)}</td>
                      <td>{zone.free_delivery_minimum ? formatMoney(zone.free_delivery_minimum) : '-'}</td>
                      <td><span className={`status ${zone.is_active ? 'green' : 'red'}`}>{zone.is_active ? 'active' : 'inactive'}</span></td>
                      <td>
                        <form action={updateDeliveryZone.bind(null, zone.id)} className="mini-form">
                          <input className="input" name="country" defaultValue={zone.country} />
                          <input className="input" name="city" defaultValue={zone.city} />
                          <input className="input" name="area" defaultValue={zone.area || ''} placeholder="Area" />
                          <input className="input" name="deliveryFee" type="number" step="0.01" defaultValue={zone.delivery_fee} />
                          <input className="input" name="sameDayFee" type="number" step="0.01" defaultValue={zone.same_day_fee} />
                          <input className="input" name="freeDeliveryMinimum" type="number" step="0.01" defaultValue={zone.free_delivery_minimum || ''} />
                          <label className="checkbox-line"><input type="checkbox" name="isActive" defaultChecked={zone.is_active} /> Active</label>
                          <button className="btn secondary" type="submit">Save</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {!(zones || []).length ? <tr><td colSpan={6}>No delivery zones yet. Run the advanced SQL patch, then create zones.</td></tr> : null}
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
