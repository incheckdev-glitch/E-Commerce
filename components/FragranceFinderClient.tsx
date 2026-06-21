'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const scentOptions = ['Oud', 'Musk', 'Amber', 'Floral', 'Fresh', 'Woody', 'Sweet', 'Spicy'];
const genderOptions = ['unisex', 'women', 'men'];
const occasionOptions = ['Daily', 'Office', 'Evening', 'Wedding', 'Gift'];
const seasonOptions = ['All Season', 'Summer', 'Winter', 'Spring'];

function buildSearchUrl(scent: string, gender: string) {
  const params = new URLSearchParams();
  if (scent) params.set('scent', scent.toLowerCase());
  if (gender) params.set('gender', gender);
  return `/shop?${params.toString()}`;
}

export function FragranceFinderClient() {
  const [scent, setScent] = useState('Oud');
  const [gender, setGender] = useState('unisex');
  const [occasion, setOccasion] = useState('Evening');
  const [season, setSeason] = useState('All Season');
  const [budget, setBudget] = useState('Luxury');

  const profile = useMemo(() => {
    const intensity = ['Oud', 'Amber', 'Woody', 'Spicy'].includes(scent) ? 'rich and long lasting' : 'soft and elegant';
    const giftText = occasion === 'Gift' ? 'Choose a safe unisex profile with premium packaging and gift wrapping.' : 'Choose a scent that matches your personal style.';
    return `Your match is a ${intensity} ${scent.toLowerCase()} fragrance for ${occasion.toLowerCase()} use. ${giftText} Budget: ${budget}. Season: ${season}.`;
  }, [scent, occasion, budget, season]);

  return (
    <div className="finder-grid">
      <div className="panel">
        <h2>Find Your Signature Scent</h2>
        <p className="muted">Answer a few questions and L&C Perfume will guide you to the right collection.</p>
        <div className="form-grid">
          <div className="form-row"><label>Scent family</label><select className="select" value={scent} onChange={(event) => setScent(event.target.value)}>{scentOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <div className="form-row"><label>Who is it for?</label><select className="select" value={gender} onChange={(event) => setGender(event.target.value)}>{genderOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <div className="form-row"><label>Occasion</label><select className="select" value={occasion} onChange={(event) => setOccasion(event.target.value)}>{occasionOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <div className="form-row"><label>Season</label><select className="select" value={season} onChange={(event) => setSeason(event.target.value)}>{seasonOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <div className="form-row"><label>Budget</label><select className="select" value={budget} onChange={(event) => setBudget(event.target.value)}><option>Under $50</option><option>$50 - $100</option><option>Luxury</option></select></div>
        </div>
      </div>
      <aside className="panel finder-result">
        <span className="eyebrow">Your Match</span>
        <h2>{scent} {gender === 'unisex' ? 'Signature' : gender === 'women' ? 'Elegance' : 'Noir'}</h2>
        <p>{profile}</p>
        <div className="badge-row"><span className="status green">{scent}</span><span className="status">{occasion}</span><span className="status">{season}</span></div>
        <Link className="btn" href={buildSearchUrl(scent, gender)} style={{ marginTop: 18 }}>View Recommended Perfumes</Link>
      </aside>
    </div>
  );
}
