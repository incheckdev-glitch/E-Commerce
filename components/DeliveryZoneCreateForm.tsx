'use client';

import { useActionState } from 'react';
import { createDeliveryZone } from '@/app/actions/admin-delivery';

const initial = { ok: false, message: '' };

export function DeliveryZoneCreateForm() {
  const [state, action] = useActionState(createDeliveryZone as any, initial);

  return (
    <form action={action} className="panel">
      <h2>Add Delivery Zone</h2>
      {state?.message ? <p className="notice">{state.message}</p> : null}
      <div className="form-grid">
        <div className="form-row"><label>Country</label><input className="input" name="country" defaultValue="Lebanon" /></div>
        <div className="form-row"><label>City</label><input className="input" name="city" placeholder="Beirut" required /></div>
        <div className="form-row"><label>Area</label><input className="input" name="area" placeholder="Hamra / Achrafieh" /></div>
        <div className="form-row"><label>Standard fee</label><input className="input" name="deliveryFee" type="number" step="0.01" defaultValue="3" /></div>
        <div className="form-row"><label>Same-day fee</label><input className="input" name="sameDayFee" type="number" step="0.01" defaultValue="6" /></div>
        <div className="form-row"><label>Free delivery minimum</label><input className="input" name="freeDeliveryMinimum" type="number" step="0.01" placeholder="100" /></div>
      </div>
      <label className="checkbox-line" style={{ marginTop: 12 }}><input type="checkbox" name="isActive" defaultChecked /> Active</label>
      <button className="btn" type="submit" style={{ marginTop: 14 }}>Create Zone</button>
    </form>
  );
}
