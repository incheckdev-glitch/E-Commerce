'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/currency';

type WishlistProduct = {
  slug: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  price?: number;
};

const STORAGE_KEY = 'lc_perfume_wishlist';

function readWishlist(): WishlistProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function WishlistClient() {
  const [items, setItems] = useState<WishlistProduct[]>([]);

  useEffect(() => {
    setItems(readWishlist());
    const refresh = () => setItems(readWishlist());
    window.addEventListener('wishlist-updated', refresh);
    return () => window.removeEventListener('wishlist-updated', refresh);
  }, []);

  function remove(slug: string) {
    const next = items.filter((item) => item.slug !== slug);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setItems(next);
  }

  if (!items.length) {
    return <div className="notice">Your wishlist is empty. Open a product and save your favorite scents.</div>;
  }

  return (
    <div className="grid">
      {items.map((item) => (
        <article className="card product-card" key={item.slug}>
          <Link href={`/product/${item.slug}`} className="product-img-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="product-img" src={item.imageUrl || '/placeholder.svg'} alt={item.name} />
          </Link>
          <div className="card-body">
            <div className="product-meta">{item.brandName}</div>
            <h3 className="product-title"><Link href={`/product/${item.slug}`}>{item.name}</Link></h3>
            {item.price ? <p className="price-line"><span className="price">{formatMoney(item.price)}</span></p> : null}
            <button className="btn secondary" type="button" onClick={() => remove(item.slug)}>Remove</button>
          </div>
        </article>
      ))}
    </div>
  );
}
