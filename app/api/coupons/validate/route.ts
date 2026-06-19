import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function deliveryFeeForMethod(method: string) {
  if (method === 'store_pickup') return 0;
  if (method === 'same_day_delivery') return 6;
  return 3;
}

function calculateDiscount(coupon: any, subtotal: number, deliveryFee: number) {
  if (coupon.discount_type === 'percentage') {
    return Math.round(subtotal * (Number(coupon.discount_value || 0) / 100) * 100) / 100;
  }
  if (coupon.discount_type === 'fixed') {
    return Math.min(Number(coupon.discount_value || 0), subtotal);
  }
  if (coupon.discount_type === 'free_delivery') {
    return deliveryFee;
  }
  return 0;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body?.code || '').trim().toUpperCase();
    const subtotal = Number(body?.subtotal || 0);
    const deliveryMethod = String(body?.deliveryMethod || 'standard_delivery');
    const deliveryFee = deliveryFeeForMethod(deliveryMethod);

    if (!code) {
      return NextResponse.json({ ok: false, message: 'Enter a coupon code.' }, { status: 400 });
    }

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ ok: false, message: 'Cart subtotal is invalid.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    if (!coupon) {
      return NextResponse.json({ ok: false, message: 'Coupon is invalid or inactive.' }, { status: 404 });
    }

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ ok: false, message: 'Coupon is not active yet.' }, { status: 400 });
    }

    if (coupon.ends_at && new Date(coupon.ends_at) < now) {
      return NextResponse.json({ ok: false, message: 'Coupon has expired.' }, { status: 400 });
    }

    if (coupon.max_uses !== null && Number(coupon.used_count || 0) >= Number(coupon.max_uses)) {
      return NextResponse.json({ ok: false, message: 'Coupon usage limit reached.' }, { status: 400 });
    }

    if (subtotal < Number(coupon.minimum_order_amount || 0)) {
      return NextResponse.json({
        ok: false,
        message: `Minimum order amount for this coupon is ${Number(coupon.minimum_order_amount || 0).toFixed(2)}.`
      }, { status: 400 });
    }

    const discountAmount = calculateDiscount(coupon, subtotal, deliveryFee);
    const total = Math.max(subtotal - discountAmount + deliveryFee, 0);

    return NextResponse.json({
      ok: true,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value || 0),
      discount_amount: discountAmount,
      delivery_fee: deliveryFee,
      total
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || String(error) }, { status: 500 });
  }
}
