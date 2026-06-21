'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

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

function writeWishlist(items: WishlistProduct[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('wishlist-updated'));
}

export function WishlistButton({ product, compact = false }: { product: WishlistProduct; compact?: boolean }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readWishlist().some((item) => item.slug === product.slug));
  }, [product.slug]);

  function toggleWishlist() {
    const current = readWishlist();
    if (current.some((item) => item.slug === product.slug)) {
      writeWishlist(current.filter((item) => item.slug !== product.slug));
      setSaved(false);
      return;
    }
    writeWishlist([{ ...product }, ...current].slice(0, 50));
    setSaved(true);
  }

  return (
    <button className={compact ? 'icon-button' : 'btn secondary'} type="button" onClick={toggleWishlist} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}>
      <Heart size={17} fill={saved ? 'currentColor' : 'none'} /> {compact ? null : saved ? 'Saved' : 'Wishlist'}
    </button>
  );
}
