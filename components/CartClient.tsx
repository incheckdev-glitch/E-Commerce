'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { readCart, writeCart } from '@/lib/cart';
import { formatMoney } from '@/lib/currency';
import type { CartItem } from '@/lib/types';

export function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => setItems(readCart()), []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  function updateQuantity(variantId: string, quantity: number) {
    const next = items.map((item) => item.variantId === variantId ? { ...item, quantity: Math.max(1, quantity) } : item);
    setItems(next);
    writeCart(next);
  }

  function removeItem(variantId: string) {
    const next = items.filter((item) => item.variantId !== variantId);
    setItems(next);
    writeCart(next);
  }

  if (!items.length) {
    return (
      <div className="panel">
        <h1>Your cart is empty</h1>
        <p className="muted">Add perfumes from the shop before checkout.</p>
        <Link className="btn" href="/shop">Shop now</Link>
      </div>
    );
  }

  return (
    <div className="detail-grid">
      <div className="panel">
        <h1>Cart</h1>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.variantId}>
                <td>
                  <strong>{item.brandName} {item.productName}</strong>
                  <div className="muted">{item.sizeMl}ml · {item.concentration}</div>
                  <div>{formatMoney(item.price)}</div>
                </td>
                <td>
                  <input className="input" style={{ maxWidth: 90 }} type="number" min={1} value={item.quantity} onChange={(e) => updateQuantity(item.variantId, Number(e.target.value))} />
                </td>
                <td>{formatMoney(item.price * item.quantity)}</td>
                <td><button className="btn danger" onClick={() => removeItem(item.variantId)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="panel">
        <h2>Summary</h2>
        <table className="table">
          <tbody>
            <tr><th>Subtotal</th><td>{formatMoney(subtotal)}</td></tr>
            <tr><th>Delivery</th><td>Calculated at checkout</td></tr>
          </tbody>
        </table>
        <div style={{ marginTop: 16 }}>
          <Link href="/checkout" className="btn full">Checkout</Link>
        </div>
      </aside>
    </div>
  );
}
