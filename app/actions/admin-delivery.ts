'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const deliveryZoneSchema = z.object({
  country: z.string().min(2).default('Lebanon'),
  city: z.string().min(1),
  area: z.string().optional(),
  deliveryFee: z.coerce.number().min(0),
  sameDayFee: z.coerce.number().min(0).optional(),
  freeDeliveryMinimum: z.coerce.number().min(0).optional(),
  isActive: z.string().optional()
});

export async function createDeliveryZone(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const access = await requireAdmin();
  if (!access.ok) return { ok: false, message: access.message };
  const parsed = deliveryZoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'Invalid delivery zone data.' };

  const input = parsed.data;
  const supabase = createAdminClient();
  const { error } = await supabase.from('delivery_zones').insert({
    country: input.country,
    city: input.city,
    area: input.area || null,
    delivery_fee: input.deliveryFee,
    same_day_fee: input.sameDayFee || input.deliveryFee,
    free_delivery_minimum: input.freeDeliveryMinimum || null,
    is_active: input.isActive === 'on'
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath('/admin/delivery');
  return { ok: true, message: 'Delivery zone created.' };
}

export async function updateDeliveryZone(zoneId: string, formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const parsed = deliveryZoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Invalid delivery zone data.');

  const input = parsed.data;
  const supabase = createAdminClient();
  const { error } = await supabase.from('delivery_zones').update({
    country: input.country,
    city: input.city,
    area: input.area || null,
    delivery_fee: input.deliveryFee,
    same_day_fee: input.sameDayFee || input.deliveryFee,
    free_delivery_minimum: input.freeDeliveryMinimum || null,
    is_active: input.isActive === 'on',
    updated_at: new Date().toISOString()
  }).eq('id', zoneId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/delivery');
}
