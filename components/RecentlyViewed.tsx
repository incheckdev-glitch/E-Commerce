'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/currency';

type ViewedProduct = {
  slug: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  price?: number;
};

const STORAGE_KEY = 'lc_perfume_recently_viewed';

function readViewed(): ViewedProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function RecentlyViewedRecorder({ product }: { product: ViewedProduct }) {
  useEffect(() => {
    const current = readViewed().filter((item) => item.slug !== product.slug);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([product, ...current].slice(0, 8)));
    window.dispatchEvent(new CustomEvent('recently-viewed-updated'));
  }, [product]);

  return null;
}

export function RecentlyViewedGrid() {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    setItems(readViewed());
    const refresh = () => setItems(readViewed());
    window.addEventListener('recently-viewed-updated', refresh);
    return () => window.removeEventListener('recently-viewed-updated', refresh);
  }, []);

  if (!items.length) return null;

  return (
    <section className="section">
      <div className="container">
        <div className="ornate-title"><span /><h2>Recently Viewed</h2><span /></div>
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
