'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const productSchema = z.object({
  brandName: z.string().min(2),
  categoryName: z.string().min(2),
  name: z.string().min(2),
  slug: z.string().min(2),
  gender: z.enum(['women', 'men', 'unisex']),
  concentration: z.string().min(2),
  scentFamily: z.string().optional(),
  description: z.string().optional(),
  topNotes: z.string().optional(),
  heartNotes: z.string().optional(),
  baseNotes: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  size50Price: z.coerce.number().optional(),
  size50Stock: z.coerce.number().int().optional(),
  size100Price: z.coerce.number().optional(),
  size100Stock: z.coerce.number().int().optional()
});

export async function createProduct(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const access = await requireAdmin();
  if (!access.ok) return { ok: false, message: access.message };

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'Invalid product data.' };

  const input = parsed.data;
  const supabase = createAdminClient();

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .upsert({ name: input.brandName, slug: input.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }, { onConflict: 'slug' })
    .select('id')
    .single();
  if (brandError) return { ok: false, message: brandError.message };

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .upsert({ name: input.categoryName, slug: input.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }, { onConflict: 'slug' })
    .select('id')
    .single();
  if (categoryError) return { ok: false, message: categoryError.message };

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      brand_id: brand.id,
      category_id: category.id,
      name: input.name,
      slug: input.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      gender: input.gender,
      concentration: input.concentration,
      scent_family: input.scentFamily,
      description: input.description,
      top_notes: input.topNotes,
      heart_notes: input.heartNotes,
      base_notes: input.baseNotes,
      status: 'active',
      sample_available: true,
      gift_wrap_available: true,
      is_returnable: true
    })
    .select('id,slug')
    .single();
  if (productError) return { ok: false, message: productError.message };

  const variants = [];
  if (input.size50Price && input.size50Stock !== undefined) {
    variants.push({ product_id: product.id, sku: `${product.slug}-50`, size_ml: 50, concentration: input.concentration, price: input.size50Price, stock_quantity: input.size50Stock });
  }
  if (input.size100Price && input.size100Stock !== undefined) {
    variants.push({ product_id: product.id, sku: `${product.slug}-100`, size_ml: 100, concentration: input.concentration, price: input.size100Price, stock_quantity: input.size100Stock });
  }
  if (variants.length) {
    const { error: variantError } = await supabase.from('product_variants').insert(variants);
    if (variantError) return { ok: false, message: variantError.message };
  }

  if (input.imageUrl) {
    const { error: imageError } = await supabase.from('product_images').insert({ product_id: product.id, image_url: input.imageUrl, is_primary: true });
    if (imageError) return { ok: false, message: imageError.message };
  }

  revalidatePath('/shop');
  revalidatePath('/admin/products');
  return { ok: true, message: 'Product created successfully.' };
}
