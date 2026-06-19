import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, user: null, profile: null, message: 'Please login first.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  const allowed = ['admin', 'manager', 'warehouse', 'support', 'accounting'];
  if (!profile || !allowed.includes(profile.role)) {
    return { ok: false as const, user, profile, message: 'Access denied. Set your user role to admin/manager/warehouse/support/accounting in Supabase.' };
  }

  return { ok: true as const, user, profile, message: '' };
}
