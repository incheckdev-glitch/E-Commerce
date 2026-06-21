import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function fallbackDeliveryFee(deliveryMethod: string, subtotal: number) {
  if (deliveryMethod === 'store_pickup') return 0;
  if (subtotal >= 100) return 0;
  if (deliveryMethod === 'same_day_delivery') return 6;
  return 3;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const country = String(body.country || 'Lebanon').trim();
    const city = String(body.city || '').trim();
    const area = String(body.area || '').trim();
    const deliveryMethod = String(body.deliveryMethod || 'standard_delivery');
    const subtotal = Number(body.subtotal || 0);

    if (deliveryMethod === 'store_pickup') {
      return NextResponse.json({ ok: true, delivery_fee: 0, message: 'Store pickup is free.' });
    }

    const supabase = createAdminClient();
    const { data: zones, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .ilike('country', country || 'Lebanon')
      .ilike('city', city || '%');

    if (error) {
      return NextResponse.json({ ok: true, delivery_fee: fallbackDeliveryFee(deliveryMethod, subtotal), message: 'Default delivery fee used.' });
    }

    const normalizedArea = area.toLowerCase();
    const exactArea = (zones || []).find((zone: any) => String(zone.area || '').toLowerCase() === normalizedArea && normalizedArea);
    const cityWide = (zones || []).find((zone: any) => !zone.area);
    const zone = exactArea || cityWide;

    if (!zone) {
      return NextResponse.json({ ok: true, delivery_fee: fallbackDeliveryFee(deliveryMethod, subtotal), message: 'Default delivery fee used.' });
    }

    if (zone.free_delivery_minimum && subtotal >= Number(zone.free_delivery_minimum)) {
      return NextResponse.json({ ok: true, delivery_fee: 0, zone, message: 'Free delivery applied.' });
    }

    const deliveryFee = deliveryMethod === 'same_day_delivery' ? Number(zone.same_day_fee || zone.delivery_fee || 0) : Number(zone.delivery_fee || 0);
    return NextResponse.json({ ok: true, delivery_fee: deliveryFee, zone, message: 'Delivery fee calculated.' });
  } catch (error: any) {
    return NextResponse.json({ ok: true, delivery_fee: 3, message: error?.message || 'Default delivery fee used.' });
  }
}
