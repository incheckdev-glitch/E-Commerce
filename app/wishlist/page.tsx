import { WishlistClient } from '@/components/WishlistClient';

export default function WishlistPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Saved Scents</span>
          <h1>Your Wishlist</h1>
          <p>Keep your favorite L&C perfumes ready for your next order or gift selection.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <WishlistClient />
        </div>
      </section>
    </main>
  );
}
