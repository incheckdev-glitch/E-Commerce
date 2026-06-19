import type { CartItem } from '@/lib/types';

export const CART_KEY = 'perfume_cart_v1';

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart:changed'));
}

export function addToCart(item: CartItem) {
  const items = readCart();
  const existing = items.find((line) => line.variantId === item.variantId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}
