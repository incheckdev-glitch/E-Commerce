import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

type ProductCardProps = {
  product: any;
};

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.product_images?.find((image: any) => image.is_primary)?.image_url || product.product_images?.[0]?.image_url || '/placeholder.svg';
  const variants = product.product_variants || [];
  const minPrice = variants.length ? Math.min(...variants.map((variant: any) => Number(variant.price || 0))) : 0;
  const compareAtValues = variants.map((variant: any) => Number(variant.compare_at_price || 0)).filter(Boolean);
  const compareAt = compareAtValues.length ? Math.min(...compareAtValues) : null;
  const totalStock = variants.reduce((sum: number, variant: any) => sum + Number(variant.stock_quantity || 0), 0);

  return (
    <article className="card product-card">
      <Link href={`/product/${product.slug}`} className="product-img-wrap">
        <span className="product-ribbon">Best Seller</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="product-img" src={primaryImage} alt={product.name} />
      </Link>
      <div className="card-body">
        <div className="product-meta">{product.brands?.name || 'L&C Perfume'} · {product.gender}</div>
        <Link href={`/product/${product.slug}`}>
          <h3 className="product-title">{product.name}</h3>
        </Link>
        <div className="muted small-text">{product.scent_family || 'Signature scent'}</div>
        <div className="card-bottom-row">
          <p className="price-line">
            <span className="price">{formatMoney(minPrice)}</span>
            {compareAt ? <span className="strike">{formatMoney(compareAt)}</span> : null}
          </p>
          <Link href={`/product/${product.slug}`} className="bag-button" aria-label={`View ${product.name}`}>
            <ShoppingBag size={17} />
          </Link>
        </div>
        <p className={totalStock > 0 ? 'status green' : 'status red'}>{totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}</p>
      </div>
    </article>
  );
}
