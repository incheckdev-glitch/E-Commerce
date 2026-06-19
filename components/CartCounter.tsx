'use client';

import { useEffect, useState } from 'react';
import { readCart } from '@/lib/cart';

export function CartCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(readCart().reduce((sum, item) => sum + item.quantity, 0));
    update();
    window.addEventListener('cart:changed', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('cart:changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  if (!count) return null;
  return <span className="status green">{count}</span>;
}
