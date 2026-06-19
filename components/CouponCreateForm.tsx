'use client';

import { useActionState } from 'react';
import { createCoupon } from '@/app/actions/admin-coupons';

const initialState = { ok: false, message: '' };

export function CouponCreateForm() {
  const [state, formAction, pending] = useActionState(createCoupon as any, initialState);

  return (
    <form action={formAction} className="panel" style={{ marginBottom: 24 }}>
      <h2>Create Coupon</h2>
      {state?.message ? <p className="notice">{state.message}</p> : null}
      <div className="form-grid">
        <div className="form-row">
          <label>Coupon code</label>
          <input className="input" name="code" placeholder="WELCOME10" required />
        </div>
        <div className="form-row">
          <label>Discount type</label>
          <select className="select" name="discountType" defaultValue="percentage">
            <option value="percentage">Percentage %</option>
            <option value="fixed">Fixed amount</option>
            <option value="free_delivery">Free delivery</option>
          </select>
        </div>
        <div className="form-row">
          <label>Discount value</label>
          <input className="input" name="discountValue" type="number" step="0.01" min="0" defaultValue="10" />
        </div>
        <div className="form-row">
          <label>Minimum order amount</label>
          <input className="input" name="minimumOrderAmount" type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <div className="form-row">
          <label>Maximum uses</label>
          <input className="input" name="maxUses" type="number" min="1" placeholder="Empty = unlimited" />
        </div>
        <div className="form-row">
          <label>Start date</label>
          <input className="input" name="startsAt" type="datetime-local" />
        </div>
        <div className="form-row">
          <label>End date</label>
          <input className="input" name="endsAt" type="datetime-local" />
        </div>
        <div className="form-row">
          <label>Status</label>
          <label className="checkbox-line"><input type="checkbox" name="isActive" defaultChecked /> Active</label>
        </div>
      </div>
      <div className="form-row" style={{ marginTop: 14 }}>
        <label>Description</label>
        <textarea className="textarea" name="description" placeholder="Example: 10% off first order" />
      </div>
      <button className="btn" style={{ marginTop: 16 }} type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Coupon'}
      </button>
    </form>
  );
}
