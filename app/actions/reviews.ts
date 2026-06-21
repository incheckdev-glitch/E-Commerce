'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  longevityRating: z.coerce.number().int().min(1).max(5).optional(),
  sillageRating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().max(120).optional(),
  comment: z.string().min(5).max(1000),
  orderNumber: z.string().optional()
});

export async function createReview(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'Please complete the review correctly.' };

  const input = parsed.data;
  const supabase = createAdminClient();
  let orderId: string | null = null;

  if (input.orderNumber) {
    const { data: order } = await supabase.from('orders').select('id').eq('order_number', input.orderNumber.trim()).maybeSingle();
    orderId = order?.id || null;
  }

  const { error } = await supabase.from('reviews').insert({
    product_id: input.productId,
    order_id: orderId,
    rating: input.rating,
    longevity_rating: input.longevityRating || null,
    sillage_rating: input.sillageRating || null,
    title: input.title || null,
    comment: input.comment,
    is_approved: false
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/reviews');
  return { ok: true, message: 'Review submitted. It will appear after admin approval.' };
}
