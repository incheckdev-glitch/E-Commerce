'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const ORDER_STATUSES = [
  'pending_payment',
  'confirmed',
  'processing',
  'packing',
  'ready_for_pickup',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded'
] as const;

const PAYMENT_STATUSES = ['unpaid', 'cod_pending', 'paid', 'failed', 'partially_refunded', 'refunded'] as const;

type OrderStatus = typeof ORDER_STATUSES[number];
type PaymentStatus = typeof PAYMENT_STATUSES[number];

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

function shipmentStatusFromOrder(status: OrderStatus) {
  if (status === 'packing') return 'packing';
  if (status === 'ready_for_pickup') return 'ready_for_pickup';
  if (status === 'shipped') return 'shipped';
  if (status === 'out_for_delivery') return 'out_for_delivery';
  if (status === 'delivered') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'returned') return 'returned';
  return null;
}

export async function updateOrderStatus(orderId: string, _currentStatus: string, formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const nextStatus = String(formData.get('orderStatus') || '');
  const note = String(formData.get('statusNote') || '').trim();
  if (!isOrderStatus(nextStatus)) throw new Error('Invalid order status.');

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('orders')
    .update({ order_status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw new Error(error.message);

  const shipmentStatus = shipmentStatusFromOrder(nextStatus);
  if (shipmentStatus) {
    await supabase
      .from('shipments')
      .update({
        delivery_status: shipmentStatus,
        shipped_at: ['shipped', 'out_for_delivery', 'delivered'].includes(nextStatus) ? new Date().toISOString() : undefined,
        delivered_at: nextStatus === 'delivered' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
  }

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: nextStatus,
    note: note || null,
    changed_by: access.user?.id || null
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
}

export async function updatePaymentStatus(orderId: string, _currentStatus: string, formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const nextStatus = String(formData.get('paymentStatus') || '');
  if (!isPaymentStatus(nextStatus)) throw new Error('Invalid payment status.');

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw new Error(error.message);

  await supabase
    .from('payments')
    .update({ payment_status: nextStatus, paid_at: nextStatus === 'paid' ? new Date().toISOString() : null })
    .eq('order_id', orderId);

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
}

export async function updateOrderInternalNote(orderId: string, formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const internalNotes = String(formData.get('internalNotes') || '').trim();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('orders')
    .update({ internal_notes: internalNotes || null, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
}
