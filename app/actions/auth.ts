'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn(_prevState: { message?: string }, formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { message: error.message };
  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function signUp(_prevState: { message?: string }, formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const fullName = String(formData.get('fullName') || '');

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) return { message: error.message };
  return { message: 'Account created. Check email confirmation if enabled in Supabase Auth.' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
