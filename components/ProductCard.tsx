import Link from 'next/link';
import { formatMoney } from '@/lib/currency';

type ProductCardProps = {
  product: any;
};

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.product_images?.find((image: any) => image.is_primary)?.image_url || product.product_images?.[0]?.image_url || '/placeholder.svg';
  const variants = product.product_variants || [];
  const minPrice = variants.length ? Math.min(...variants.map((variant: any) => Number(variant.price))) : 0;
  const totalStock = variants.reduce((sum: number, variant: any) => sum + Number(variant.stock_quantity || 0), 0);

  return (
    <article className="card">
      <Link href={`/product/${product.slug}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="product-img" src={primaryImage} alt={product.name} />
      </Link>
      <div className="card-body">
        <div className="muted">{product.brands?.name || 'Maison'} · {product.gender}</div>
        <Link href={`/product/${product.slug}`}>
          <h3 className="product-title">{product.name}</h3>
        </Link>
        <div className="muted">{product.scent_family || 'Signature scent'}</div>
        <p>
          <span className="price">{formatMoney(minPrice)}</span>
        </p>
        <p className={totalStock > 0 ? 'status green' : 'status red'}>{totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}</p>
      </div>
    </article>
  );
}
