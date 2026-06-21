'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function adjustVariantStock(variantId: string, formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const delta = Number(formData.get('quantityDelta') || 0);
  const notes = String(formData.get('notes') || '').trim();

  if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
    throw new Error('Enter a whole number stock adjustment. Example: 5 or -2.');
  }

  const supabase = createAdminClient();
  const { data: variant, error: fetchError } = await supabase
    .from('product_variants')
    .select('id, stock_quantity')
    .eq('id', variantId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const nextStock = Math.max(Number(variant.stock_quantity || 0) + delta, 0);
  const { error } = await supabase
    .from('product_variants')
    .update({ stock_quantity: nextStock, updated_at: new Date().toISOString() })
    .eq('id', variantId);

  if (error) throw new Error(error.message);

  await supabase.from('inventory_movements').insert({
    variant_id: variantId,
    movement_type: 'adjustment',
    quantity: delta,
    reference_type: 'manual_adjustment',
    notes: notes || 'Manual admin stock adjustment',
    created_by: access.user?.id || null
  });

  revalidatePath('/admin');
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/shop');
}
