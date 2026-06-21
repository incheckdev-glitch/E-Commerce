import { FragranceFinderClient } from '@/components/FragranceFinderClient';

export default function FragranceFinderPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Fragrance Finder</span>
          <h1>Discover Your Signature Scent</h1>
          <p>Choose your preferred notes, occasion, season, and budget. We will guide you to the best L&C Perfume collection.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <FragranceFinderClient />
        </div>
      </section>
    </main>
  );
}
