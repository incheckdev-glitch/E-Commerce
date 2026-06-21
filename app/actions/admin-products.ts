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
  occasion: z.string().optional(),
  season: z.string().optional(),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  size30Price: z.coerce.number().optional(),
  size30Stock: z.coerce.number().int().optional(),
  size50Price: z.coerce.number().optional(),
  size50Stock: z.coerce.number().int().optional(),
  size100Price: z.coerce.number().optional(),
  size100Stock: z.coerce.number().int().optional(),
  sampleAvailable: z.string().optional(),
  testerAvailable: z.string().optional(),
  giftWrapAvailable: z.string().optional(),
  isReturnable: z.string().optional(),
  hasShippingRestriction: z.string().optional()
});

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createProduct(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const access = await requireAdmin();
  if (!access.ok) return { ok: false, message: access.message };

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'Invalid product data.' };

  const input = parsed.data;
  const supabase = createAdminClient();

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .upsert({ name: input.brandName, slug: slugify(input.brandName) }, { onConflict: 'slug' })
    .select('id')
    .single();
  if (brandError) return { ok: false, message: brandError.message };

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .upsert({ name: input.categoryName, slug: slugify(input.categoryName) }, { onConflict: 'slug' })
    .select('id')
    .single();
  if (categoryError) return { ok: false, message: categoryError.message };

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      brand_id: brand.id,
      category_id: category.id,
      name: input.name,
      slug: slugify(input.slug),
      gender: input.gender,
      concentration: input.concentration,
      scent_family: input.scentFamily || null,
      description: input.description || null,
      top_notes: input.topNotes || null,
      heart_notes: input.heartNotes || null,
      base_notes: input.baseNotes || null,
      occasion: input.occasion || null,
      season: input.season || null,
      ingredients: input.ingredients || null,
      allergens: input.allergens || null,
      country_of_origin: input.countryOfOrigin || null,
      status: 'active',
      sample_available: input.sampleAvailable === 'on',
      tester_available: input.testerAvailable === 'on',
      gift_wrap_available: input.giftWrapAvailable !== 'off',
      is_returnable: input.isReturnable !== 'off',
      has_shipping_restriction: input.hasShippingRestriction === 'on'
    })
    .select('id,slug')
    .single();
  if (productError) return { ok: false, message: productError.message };

  const variants = [];
  if (input.size30Price && input.size30Stock !== undefined) {
    variants.push({ product_id: product.id, sku: `${product.slug}-30`, size_ml: 30, concentration: input.concentration, price: input.size30Price, stock_quantity: input.size30Stock });
  }
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

export async function setProductStatus(productId: string, formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const status = String(formData.get('status') || 'hidden');
  if (!['draft', 'active', 'hidden', 'discontinued'].includes(status)) throw new Error('Invalid product status.');

  const supabase = createAdminClient();
  const { error } = await supabase.from('products').update({ status, updated_at: new Date().toISOString() }).eq('id', productId);
  if (error) throw new Error(error.message);

  revalidatePath('/shop');
  revalidatePath('/admin/products');
}

export async function updateProductBasics(productId: string, formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const supabase = createAdminClient();
  const payload = {
    name: String(formData.get('name') || '').trim(),
    description: String(formData.get('description') || '').trim() || null,
    scent_family: String(formData.get('scentFamily') || '').trim() || null,
    top_notes: String(formData.get('topNotes') || '').trim() || null,
    heart_notes: String(formData.get('heartNotes') || '').trim() || null,
    base_notes: String(formData.get('baseNotes') || '').trim() || null,
    occasion: String(formData.get('occasion') || '').trim() || null,
    season: String(formData.get('season') || '').trim() || null,
    updated_at: new Date().toISOString()
  };

  if (!payload.name) throw new Error('Product name is required.');

  const { error } = await supabase.from('products').update(payload).eq('id', productId);
  if (error) throw new Error(error.message);

  revalidatePath('/shop');
  revalidatePath('/admin/products');
}

export async function updateVariantBasics(variantId: string, formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const price = Number(formData.get('price') || 0);
  const compareAtPriceRaw = String(formData.get('compareAtPrice') || '').trim();
  const stockQuantity = Number(formData.get('stockQuantity') || 0);
  const lowStockThreshold = Number(formData.get('lowStockThreshold') || 5);

  if (!Number.isFinite(price) || price < 0) throw new Error('Invalid price.');
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) throw new Error('Invalid stock quantity.');
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) throw new Error('Invalid low stock threshold.');

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('product_variants')
    .update({
      price,
      compare_at_price: compareAtPriceRaw ? Number(compareAtPriceRaw) : null,
      stock_quantity: stockQuantity,
      low_stock_threshold: lowStockThreshold,
      updated_at: new Date().toISOString()
    })
    .eq('id', variantId);

  if (error) throw new Error(error.message);

  revalidatePath('/shop');
  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
}

export async function uploadProductImage(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const access = await requireAdmin();
  if (!access.ok) return { ok: false, message: access.message };

  const productId = String(formData.get('productId') || '');
  const file = formData.get('image') as File | null;
  if (!productId) return { ok: false, message: 'Missing product id.' };
  if (!file || typeof file === 'string' || file.size === 0) return { ok: false, message: 'Choose an image file.' };

  const supabase = createAdminClient();
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${productId}/${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false
  });
  if (uploadError) return { ok: false, message: uploadError.message };

  const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path);
  const { error: imageError } = await supabase.from('product_images').insert({
    product_id: productId,
    image_url: publicUrlData.publicUrl,
    is_primary: true
  });
  if (imageError) return { ok: false, message: imageError.message };

  revalidatePath('/shop');
  revalidatePath('/admin/products');
  return { ok: true, message: 'Product image uploaded.' };
}

export async function softDeleteProduct(productId: string, _formData: FormData): Promise<void> {
  const access = await requireAdmin();
  if (!access.ok) throw new Error(access.message);

  const supabase = createAdminClient();
  const { error } = await supabase.from('products').update({ status: 'discontinued', updated_at: new Date().toISOString() }).eq('id', productId);
  if (error) throw new Error(error.message);
  await supabase.from('product_variants').update({ is_active: false, updated_at: new Date().toISOString() }).eq('product_id', productId);

  revalidatePath('/shop');
  revalidatePath('/admin/products');
}
