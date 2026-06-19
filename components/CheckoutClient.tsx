'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { createCheckoutOrder } from '@/app/actions/checkout';
import { clearCart, readCart } from '@/lib/cart';
import { formatMoney } from '@/lib/currency';
import type { CartItem } from '@/lib/types';

const initialState = { ok: false, message: '' };

export function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [state, formAction] = useActionState(createCheckoutOrder as any, initialState);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const checkoutItems = items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity }));

  useEffect(() => setItems(readCart()), []);
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success')) clearCart();
  }, []);

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
          <div className="form-row"><label>Coupon code</label><input className="input" name="couponCode" /></div>
          <div className="form-row">
            <label>Delivery method</label>
            <select className="select" name="deliveryMethod">
              <option value="standard_delivery">Standard delivery</option>
              <option value="same_day_delivery">Same-day delivery</option>
              <option value="store_pickup">Store pickup</option>
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
            <tr><th>Delivery</th><td>Calculated by method</td></tr>
          </tbody>
        </table>
      </aside>
    </form>
  );
}
