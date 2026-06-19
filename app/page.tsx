import Link from 'next/link';
import { Leaf, Sparkles, Crown, Gem, Star } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';

const fallbackHeroImage = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1100&q=85';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, gender, scent_family, concentration, brands(name), product_images(image_url,is_primary), product_variants(id,price,compare_at_price,stock_quantity,size_ml)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4);

  const featuredImage = products?.[0]?.product_images?.find((image: any) => image.is_primary)?.image_url || products?.[0]?.product_images?.[0]?.image_url || fallbackHeroImage;

  const categories = [
    { title: 'Women', subtitle: 'Elegant & timeless', href: '/shop?gender=women', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80' },
    { title: 'Men', subtitle: 'Bold & refined', href: '/shop?gender=men', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=900&q=80' },
    { title: 'Unisex', subtitle: 'Balanced & versatile', href: '/shop?gender=unisex', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80' },
    { title: 'Oud', subtitle: 'Rich & intense', href: '/shop?scent=oud', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80' }
  ];

  return (
    <main>
      <section className="hero luxury-hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Luxury in every drop</span>
            <h1>Timeless Scents, Crafted for Elegance</h1>
            <p>
              Discover L&C Perfume: refined fragrances with amber warmth, oud depth, floral softness, and a signature luxury finish.
            </p>
            <div className="hero-actions">
              <Link className="btn" href="/shop">Shop Now</Link>
              <Link className="btn secondary" href="/shop?scent=oud">Discover Collection</Link>
            </div>
          </div>

          <div className="hero-visual" aria-label="Luxury perfume bottle presentation">
            <div className="hero-glow" />
            <div className="hero-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lc-logo.jpeg" alt="L&C Perfume logo" />
              <span>Extrait de Parfum</span>
              <strong>100ml · 3.4 FL.OZ</strong>
            </div>
            <div className="hero-bottle-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredImage} alt="L&C Perfume featured bottle" />
              <div className="bottle-label">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/lc-logo.jpeg" alt="L&C Perfume" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section category-section">
        <div className="container">
          <div className="ornate-title">
            <span />
            <h2>Explore by Category</h2>
            <span />
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link href={category.href} className="category-card" key={category.title}>
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.subtitle}</p>
                  <b>→</b>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={category.image} alt={category.title} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section best-sellers-section">
        <div className="container">
          <div className="ornate-title">
            <span />
            <h2>Best Sellers</h2>
            <span />
          </div>
          <div className="grid">
            {(products || []).map((product: any) => <ProductCard key={product.id} product={product} />)}
          </div>
          {(!products || products.length === 0) ? <div className="notice">No products yet. Add active products from Admin → Products.</div> : null}
        </div>
      </section>

      <section className="section story-section">
        <div className="story-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=85" alt="Fine perfume craftsmanship" />
        </div>
        <div className="container story-grid">
          <div />
          <div className="story-copy">
            <span className="eyebrow">Our Story</span>
            <h2>The Art of Fine Perfumery</h2>
            <p>
              At L&C Perfume, fragrance is more than a scent. It is identity, emotion, and memory. Each creation is crafted with elegant notes, premium ingredients, and timeless presentation.
            </p>
            <Link href="/shop" className="btn secondary">Learn More About Us</Link>
          </div>
          <div className="feature-list">
            <div><Leaf /> <strong>Premium Ingredients</strong><span>Sourced from trusted fragrance houses</span></div>
            <div><Sparkles /> <strong>Expert Craftsmanship</strong><span>Balanced notes with long-lasting elegance</span></div>
            <div><Crown /> <strong>Timeless Elegance</strong><span>Scents designed to leave a legacy</span></div>
          </div>
        </div>
      </section>

      <section className="section testimonials-section">
        <div className="container">
          <div className="ornate-title">
            <span />
            <h2>Loved by Our Customers</h2>
            <span />
          </div>
          <div className="testimonial-grid">
            {[
              ['L&C Perfume has the most luxurious and long-lasting scents. Every time I wear it, I get compliments.', 'Olivia R.'],
              ['The quality is unmatched. You can feel the elegance and sophistication in every bottle.', 'Daniel K.'],
              ['My go-to brand for special occasions. Rich, unique, and absolutely mesmerizing fragrances.', 'Aisha M.']
            ].map(([quote, name]) => (
              <div className="testimonial-card" key={name}>
                <Gem />
                <p>“{quote}”</p>
                <strong>— {name}</strong>
                <div className="stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="newsletter-section">
        <div className="container newsletter-box">
          <div>
            <span className="eyebrow">Stay in the scent</span>
            <h2>Subscribe for exclusive offers, new arrivals, and fragrance inspiration.</h2>
          </div>
          <form className="newsletter-form">
            <input className="input" type="email" placeholder="Enter your email address" />
            <button className="btn" type="button">Subscribe</button>
          </form>
        </div>
      </section>
    </main>
  );
}
