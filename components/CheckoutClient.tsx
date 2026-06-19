'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { createCheckoutOrder } from '@/app/actions/checkout';
import { clearCart, readCart } from '@/lib/cart';
import { formatMoney } from '@/lib/currency';
import type { CartItem } from '@/lib/types';

const initialState = { ok: false, message: '' };

type AppliedCoupon = {
  ok: true;
  code: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
};

function deliveryFeeForMethod(method: string) {
  if (method === 'store_pickup') return 0;
  if (method === 'same_day_delivery') return 6;
  return 3;
}

export function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [state, formAction] = useActionState(createCheckoutOrder as any, initialState);
  const [deliveryMethod, setDeliveryMethod] = useState('standard_delivery');
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const deliveryFee = deliveryFeeForMethod(deliveryMethod);
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const total = Math.max(subtotal - discountAmount + deliveryFee, 0);
  const checkoutItems = items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity }));

  useEffect(() => setItems(readCart()), []);
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success')) clearCart();
  }, []);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponMessage('');
  }, [deliveryMethod, subtotal]);

  async function applyCoupon() {
    const code = couponCode.trim();
    setCouponMessage('');
    setAppliedCoupon(null);

    if (!code) {
      setCouponMessage('Enter a coupon code.');
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, deliveryMethod })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setCouponMessage(result.message || 'Coupon is invalid.');
        return;
      }
      setAppliedCoupon(result);
      setCouponCode(result.code);
      setCouponMessage(`Coupon ${result.code} applied.`);
    } catch (error: any) {
      setCouponMessage(error?.message || 'Unable to validate coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  }

  if (!items.length) {
    return <div className="notice">Your cart is empty. Please add products before checkout.</div>;
  }

  return (
    <form action={formAction} className="detail-grid">
      <div className="panel">
        <h1>Checkout</h1>
        {state?.message ? <p className="notice">{state.message}</p> : null}
        <input type="hidden" name="itemsJson" value={JSON.stringify(checkoutItems)} />
        <div className="form-grid">
          <div className="form-row"><label>Full name</label><input className="input" name="fullName" required /></div>
          <div className="form-row"><label>Email</label><input className="input" name="email" type="email" required /></div>
          <div className="form-row"><label>Phone</label><input className="input" name="phone" required /></div>
          <div className="form-row"><label>Country</label><input className="input" name="country" defaultValue="Lebanon" required /></div>
          <div className="form-row"><label>City</label><input className="input" name="city" required /></div>
          <div className="form-row"><label>Area</label><input className="input" name="area" /></div>
          <div className="form-row"><label>Street</label><input className="input" name="street" required /></div>
          <div className="form-row"><label>Building</label><input className="input" name="building" /></div>
          <div className="form-row"><label>Floor</label><input className="input" name="floor" /></div>
          <div className="form-row">
            <label>Coupon code</label>
            <div className="inline-field">
              <input className="input" name="couponCode" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setAppliedCoupon(null); setCouponMessage(''); }} placeholder="WELCOME10" />
              <button className="btn secondary" type="button" onClick={applyCoupon} disabled={applyingCoupon}>{applyingCoupon ? 'Checking...' : 'Apply'}</button>
            </div>
            {couponMessage ? <span className={appliedCoupon ? 'success-text' : 'error-text'}>{couponMessage}</span> : null}
          </div>
          <div className="form-row">
            <label>Delivery method</label>
            <select className="select" name="deliveryMethod" value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value)}>
              <option value="standard_delivery">Standard delivery — {formatMoney(3)}</option>
              <option value="same_day_delivery">Same-day delivery — {formatMoney(6)}</option>
              <option value="store_pickup">Store pickup — Free</option>
            </select>
          </div>
          <div className="form-row">
            <label>Payment method</label>
            <select className="select" name="paymentMethod">
              <option value="cash_on_delivery">Cash on delivery</option>
              <option value="card">Card payment</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
          </div>
        </div>
        <div className="form-row" style={{ marginTop: 14 }}><label>Delivery notes</label><textarea className="textarea" name="notes" /></div>
        <div className="form-row" style={{ marginTop: 14 }}><label><input type="checkbox" name="giftWrap" /> Gift wrapping</label></div>
        <div className="form-row"><label>Gift message</label><textarea className="textarea" name="giftMessage" /></div>
        <button className="btn" style={{ marginTop: 16 }} type="submit">Place Order</button>
      </div>

      <aside className="panel">
        <h2>Order Summary</h2>
        <table className="table">
          <tbody>
            {items.map((item) => (
              <tr key={item.variantId}>
                <td>{item.productName}<div className="muted">{item.sizeMl}ml × {item.quantity}</div></td>
                <td>{formatMoney(item.price * item.quantity)}</td>
              </tr>
            ))}
            <tr><th>Subtotal</th><td>{formatMoney(subtotal)}</td></tr>
            <tr><th>Delivery</th><td>{formatMoney(deliveryFee)}</td></tr>
            {appliedCoupon ? <tr><th>Coupon {appliedCoupon.code}</th><td>-{formatMoney(discountAmount)}</td></tr> : null}
            <tr><th>Total</th><td><strong>{formatMoney(total)}</strong></td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 12 }}>Coupons are checked again when the order is submitted.</p>
      </aside>
    </form>
  );
}
