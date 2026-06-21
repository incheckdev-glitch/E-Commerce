'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function setReviewApproval(reviewId: string, isApproved: boolean, _formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const supabase = createAdminClient();
  const { error } = await supabase.from('reviews').update({ is_approved: isApproved }).eq('id', reviewId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/reviews');
  revalidatePath('/shop');
}
