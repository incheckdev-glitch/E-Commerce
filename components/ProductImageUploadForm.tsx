'use client';

import { useActionState } from 'react';
import { uploadProductImage } from '@/app/actions/admin-products';

const initial = { ok: false, message: '' };

export function ProductImageUploadForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(uploadProductImage as any, initial);

  return (
    <form action={action} className="mini-form">
      <input type="hidden" name="productId" value={productId} />
      <input className="input" type="file" name="image" accept="image/*" />
      <button className="btn secondary" type="submit">Upload Image</button>
      {state?.message ? <span className={state.ok ? 'success-text' : 'error-text'}>{state.message}</span> : null}
    </form>
  );
}
