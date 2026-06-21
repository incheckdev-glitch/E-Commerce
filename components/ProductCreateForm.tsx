'use client';

import { useActionState } from 'react';
import { createProduct } from '@/app/actions/admin-products';

const initial = { ok: false, message: '' };

export function ProductCreateForm() {
  const [state, action] = useActionState(createProduct as any, initial);

  return (
    <form action={action} className="panel">
      <h2>Add Perfume</h2>
      {state?.message ? <p className="notice">{state.message}</p> : null}
      <div className="form-grid">
        <div className="form-row"><label>Brand</label><input className="input" name="brandName" required /></div>
        <div className="form-row"><label>Category</label><input className="input" name="categoryName" defaultValue="Unisex Perfume" required /></div>
        <div className="form-row"><label>Name</label><input className="input" name="name" required /></div>
        <div className="form-row"><label>Slug</label><input className="input" name="slug" placeholder="example-perfume-name" required /></div>
        <div className="form-row"><label>Gender</label><select className="select" name="gender"><option value="unisex">Unisex</option><option value="women">Women</option><option value="men">Men</option></select></div>
        <div className="form-row"><label>Concentration</label><input className="input" name="concentration" defaultValue="EDP" required /></div>
        <div className="form-row"><label>Scent family</label><input className="input" name="scentFamily" placeholder="Woody, floral, oud..." /></div>
        <div className="form-row"><label>Occasion</label><input className="input" name="occasion" placeholder="Daily, evening, wedding" /></div>
        <div className="form-row"><label>Season</label><input className="input" name="season" placeholder="Summer, winter, all-season" /></div>
        <div className="form-row"><label>Country of origin</label><input className="input" name="countryOfOrigin" /></div>
        <div className="form-row"><label>Image URL</label><input className="input" name="imageUrl" placeholder="https://..." /></div>
        <div className="form-row"><label>30ml price</label><input className="input" name="size30Price" type="number" step="0.01" /></div>
        <div className="form-row"><label>30ml stock</label><input className="input" name="size30Stock" type="number" /></div>
        <div className="form-row"><label>50ml price</label><input className="input" name="size50Price" type="number" step="0.01" /></div>
        <div className="form-row"><label>50ml stock</label><input className="input" name="size50Stock" type="number" /></div>
        <div className="form-row"><label>100ml price</label><input className="input" name="size100Price" type="number" step="0.01" /></div>
        <div className="form-row"><label>100ml stock</label><input className="input" name="size100Stock" type="number" /></div>
      </div>
      <div className="form-row" style={{ marginTop: 14 }}><label>Description</label><textarea className="textarea" name="description" /></div>
      <div className="form-grid" style={{ marginTop: 14 }}>
        <div className="form-row"><label>Top notes</label><input className="input" name="topNotes" /></div>
        <div className="form-row"><label>Heart notes</label><input className="input" name="heartNotes" /></div>
        <div className="form-row"><label>Base notes</label><input className="input" name="baseNotes" /></div>
        <div className="form-row"><label>Ingredients</label><input className="input" name="ingredients" /></div>
        <div className="form-row"><label>Allergens</label><input className="input" name="allergens" /></div>
      </div>
      <div className="badge-row" style={{ marginTop: 14 }}>
        <label className="checkbox-line"><input type="checkbox" name="sampleAvailable" defaultChecked /> Sample available</label>
        <label className="checkbox-line"><input type="checkbox" name="testerAvailable" /> Tester available</label>
        <label className="checkbox-line"><input type="checkbox" name="giftWrapAvailable" defaultChecked /> Gift wrap</label>
        <label className="checkbox-line"><input type="checkbox" name="hasShippingRestriction" /> Shipping restriction</label>
      </div>
      <button className="btn" style={{ marginTop: 16 }}>Create Product</button>
    </form>
  );
}
