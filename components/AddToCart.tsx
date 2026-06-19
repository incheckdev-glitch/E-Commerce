'use client';

import { useMemo, useState } from 'react';
import { addToCart } from '@/lib/cart';
import { formatMoney } from '@/lib/currency';

type Variant = {
  id: string;
  size_ml: number;
  concentration: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
};

type AddToCartProps = {
  product: {
    slug: string;
    name: string;
    brandName: string;
    imageUrl: string | null;
  };
  variants: Variant[];
};

export function AddToCart({ product, variants }: AddToCartProps) {
  const firstAvailable = useMemo(() => variants.find((variant) => Number(variant.stock_quantity) > 0) || variants[0], [variants]);
  const [selectedId, setSelectedId] = useState(firstAvailable?.id || '');
  const [quantity, setQuantity] = useState(1);
  const selected = variants.find((variant) => variant.id === selectedId);

  function handleAdd() {
    if (!selected) return;
    addToCart({
      variantId: selected.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: product.brandName,
      sizeMl: selected.size_ml,
      concentration: selected.concentration,
      price: Number(selected.price),
      imageUrl: product.imageUrl,
      quantity
    });
    alert('Added to cart');
  }

  if (!variants.length) return <p className="notice">No variants available for this perfume.</p>;

  return (
    <div>
      <div className="variant-grid">
        {variants.map((variant) => (
          <button
            type="button"
            key={variant.id}
            className={variant.id === selectedId ? 'variant-card active' : 'variant-card'}
            disabled={Number(variant.stock_quantity) <= 0}
            onClick={() => setSelectedId(variant.id)}
          >
            <strong>{variant.size_ml}ml</strong>
            <div className="muted">{variant.concentration}</div>
            <div>{formatMoney(variant.price)}</div>
            <div className="muted">{variant.stock_quantity} left</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
        <input
          className="input"
          type="number"
          min={1}
          max={selected?.stock_quantity || 1}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
        />
        <button className="btn" disabled={!selected || Number(selected.stock_quantity) <= 0} onClick={handleAdd}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
