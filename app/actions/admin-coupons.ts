'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const couponSchema = z.object({
  code: z.string().min(2).max(50),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed', 'free_delivery']),
  discountValue: z.coerce.number().min(0),
  minimumOrderAmount: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.string().optional()
});

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export async function createCoupon(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const access = await requireAdmin();
  if (!access.ok) return { ok: false, message: access.message };

  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'Invalid coupon data.' };

  const input = parsed.data;
  const code = normalizeCouponCode(input.code);

  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { ok: false, message: 'Coupon code can only contain letters, numbers, underscore, or dash.' };
  }

  if (input.discountType === 'percentage' && input.discountValue > 100) {
    return { ok: false, message: 'Percentage discount cannot exceed 100%.' };
  }

  if (input.discountType === 'free_delivery') {
    input.discountValue = 0;
  }

  const startsAt = input.startsAt ? new Date(input.startsAt).toISOString() : null;
  const endsAt = input.endsAt ? new Date(input.endsAt).toISOString() : null;

  if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
    return { ok: false, message: 'Start date cannot be after end date.' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('coupons').insert({
    code,
    description: input.description || null,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    minimum_order_amount: input.minimumOrderAmount || 0,
    max_uses: input.maxUses || null,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: input.isActive === 'on'
  });

  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      return { ok: false, message: 'This coupon code already exists.' };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath('/admin/coupons');
  return { ok: true, message: `Coupon ${code} created successfully.` };
}

export async function setCouponActive(couponId: string, isActive: boolean, _formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) {
    throw new Error(access.message);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', couponId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/coupons');
}
