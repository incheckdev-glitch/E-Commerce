'use client';

import { useActionState } from 'react';
import { createReview } from '@/app/actions/reviews';

const initial = { ok: false, message: '' };

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(createReview as any, initial);

  return (
    <form action={action} className="panel">
      <h2>Write a Review</h2>
      {state?.message ? <p className="notice">{state.message}</p> : null}
      <input type="hidden" name="productId" value={productId} />
      <div className="form-grid">
        <div className="form-row"><label>Rating</label><select className="select" name="rating" defaultValue="5"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></div>
        <div className="form-row"><label>Longevity</label><select className="select" name="longevityRating" defaultValue="5"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div>
        <div className="form-row"><label>Sillage</label><select className="select" name="sillageRating" defaultValue="5"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div>
        <div className="form-row"><label>Order number optional</label><input className="input" name="orderNumber" placeholder="ORD-2026-000001" /></div>
      </div>
      <div className="form-row" style={{ marginTop: 12 }}><label>Title</label><input className="input" name="title" placeholder="Elegant and long lasting" /></div>
      <div className="form-row" style={{ marginTop: 12 }}><label>Comment</label><textarea className="textarea" name="comment" required /></div>
      <button className="btn" type="submit" style={{ marginTop: 14 }}>Submit Review</button>
    </form>
  );
}
