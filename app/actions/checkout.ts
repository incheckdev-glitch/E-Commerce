'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

const checkoutSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  country: z.string().min(2),
  city: z.string().min(2),
  area: z.string().optional(),
  street: z.string().min(2),
  building: z.string().optional(),
  floor: z.string().optional(),
  notes: z.string().optional(),
  deliveryMethod: z.string().default('standard_delivery'),
  paymentMethod: z.string().default('cash_on_delivery'),
  couponCode: z.string().optional(),
  giftWrap: z.string().optional(),
  giftMessage: z.string().optional(),
  itemsJson: z.string().min(2)
});

type CheckoutItem = { variant_id: string; quantity: number };

function normalizeCouponCode(code?: string | null) {
  return String(code || '').trim().toUpperCase();
}

async function validateCouponForOrder(supabase: ReturnType<typeof createAdminClient>, couponCode: string, items: CheckoutItem[]) {
  const code = normalizeCouponCode(couponCode);
  if (!code) return { ok: true };

  const variantIds = Array.from(new Set(items.map((item) => item.variant_id)));
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id,price')
    .in('id', variantIds);

  if (variantsError) return { ok: false, message: variantsError.message };

  const priceById = new Map((variants || []).map((variant: any) => [variant.id, Number(variant.price || 0)]));
  const subtotal = items.reduce((sum, item) => sum + (priceById.get(item.variant_id) || 0) * Number(item.quantity || 0), 0);

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!coupon) return { ok: false, message: 'Coupon is invalid or inactive.' };

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return { ok: false, message: 'Coupon is not active yet.' };
  if (coupon.ends_at && new Date(coupon.ends_at) < now) return { ok: false, message: 'Coupon has expired.' };
  if (coupon.max_uses !== null && Number(coupon.used_count || 0) >= Number(coupon.max_uses)) return { ok: false, message: 'Coupon usage limit reached.' };
  if (subtotal < Number(coupon.minimum_order_amount || 0)) return { ok: false, message: `Minimum order amount for this coupon is ${Number(coupon.minimum_order_amount || 0).toFixed(2)}.` };

  return { ok: true };
}

export async function createCheckoutOrder(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: 'Please fill all required checkout fields correctly.' };
  }

  let items: CheckoutItem[] = [];
  try {
    items = JSON.parse(parsed.data.itemsJson);
  } catch {
    return { ok: false, message: 'Cart data is invalid. Please refresh and try again.' };
  }

  if (!items.length) return { ok: false, message: 'Cart is empty.' };

  const supabase = createAdminClient();
  const couponCode = normalizeCouponCode(parsed.data.couponCode);
  const couponCheck = await validateCouponForOrder(supabase, couponCode, items);
  if (!couponCheck.ok) return { ok: false, message: couponCheck.message };

  const { data, error } = await supabase.rpc('create_checkout_order', {
    p_customer: {
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone
    },
    p_shipping_address: {
      country: parsed.data.country,
      city: parsed.data.city,
      area: parsed.data.area,
      street: parsed.data.street,
      building: parsed.data.building,
      floor: parsed.data.floor,
      notes: parsed.data.notes
    },
    p_items: items,
    p_payment_method: parsed.data.paymentMethod,
    p_delivery_method: parsed.data.deliveryMethod,
    p_coupon_code: couponCode || null,
    p_gift: {
      gift_wrap: parsed.data.giftWrap === 'on',
      gift_message: parsed.data.giftMessage
    }
  });

  if (error) return { ok: false, message: error.message };

  const order = Array.isArray(data) ? data[0] : data;
  redirect(`/orders/${order.order_number}?success=1`);
}
