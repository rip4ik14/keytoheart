// ✅ Путь: app/admin/(protected)/categories/actions.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const cleanText = (v: unknown) => {
  const s = String(v ?? '').trim();
  return s.length ? s : null;
};

const cleanBool = (v: unknown, fallback = false) => {
  // чекбоксы в FormData часто приходят как "on"
  if (v === 'true' || v === 'on' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  if (typeof v === 'boolean') return v;
  return fallback;
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

/* --------------------------------- Category -------------------------------- */

export async function addCategory(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();
  const is_visible = cleanBool(formData.get('is_visible'), true);

  if (!name) throw new Error('Название обязательно');
  if (!slug) slug = generateSlug(name);
  if (!slug) throw new Error('Slug обязателен');

  const payload: TablesInsert<'categories'> = {
    name,
    slug,
    is_visible,

    seo_h1: cleanText(formData.get('seo_h1')),
    seo_title: cleanText(formData.get('seo_title')),
    seo_description: cleanText(formData.get('seo_description')),
    seo_text: cleanText(formData.get('seo_text')),
    og_image: cleanText(formData.get('og_image')),
    seo_noindex: cleanBool(formData.get('seo_noindex'), false),
  };

  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('id,name,slug,is_visible,seo_h1,seo_title,seo_description,seo_text,og_image,seo_noindex')
    .single();

  if (error) throw new Error(error.message);
  return { success: true, category: data };
}

export async function updateCategory(formData: FormData) {
  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();

  if (!id) throw new Error('ID обязателен');
  if (!name) throw new Error('Название обязательно');

  if (!slug) slug = generateSlug(name);
  if (!slug) throw new Error('Slug обязателен');

  const payload: TablesUpdate<'categories'> = {
    name,
    slug,
    is_visible: cleanBool(formData.get('is_visible'), true),

    seo_h1: cleanText(formData.get('seo_h1')),
    seo_title: cleanText(formData.get('seo_title')),
    seo_description: cleanText(formData.get('seo_description')),
    seo_text: cleanText(formData.get('seo_text')),
    og_image: cleanText(formData.get('og_image')),
    seo_noindex: cleanBool(formData.get('seo_noindex'), false),
  };

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('id,name,slug,is_visible,seo_h1,seo_title,seo_description,seo_text,og_image,seo_noindex')
    .single();

  if (error) throw new Error(error.message);
  return { success: true, category: data };
}

export async function deleteCategory(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID обязателен');

  // Проверка товаров
  const { data: products, error: productsError } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', id)
    .limit(1);

  if (productsError) throw new Error(productsError.message);
  if (products?.length) throw new Error('Нельзя удалить категорию с товарами');

  // Удаляем подкатегории
  const { error: subError } = await supabase.from('subcategories').delete().eq('category_id', id);
  if (subError) throw new Error(subError.message);

  // Удаляем категорию
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
}

/* ------------------------------- Subcategory ------------------------------- */

export async function addSubcategory(formData: FormData) {
  const category_id = Number(formData.get('category_id'));
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();

  if (!category_id) throw new Error('Категория обязательна');
  if (!name) throw new Error('Название обязательно');

  if (!slug) slug = generateSlug(name);
  if (!slug) throw new Error('Slug обязателен');

  const payload: TablesInsert<'subcategories'> = {
    category_id,
    name,
    slug,
    is_visible: cleanBool(formData.get('is_visible'), true),

    seo_h1: cleanText(formData.get('seo_h1')),
    seo_title: cleanText(formData.get('seo_title')),
    seo_description: cleanText(formData.get('seo_description')),
    seo_text: cleanText(formData.get('seo_text')),
    og_image: cleanText(formData.get('og_image')),
    seo_noindex: cleanBool(formData.get('seo_noindex'), false),
  };

  const { data, error } = await supabase
    .from('subcategories')
    .insert(payload)
    .select('id,name,slug,category_id,is_visible,seo_h1,seo_title,seo_description,seo_text,og_image,seo_noindex')
    .single();

  if (error) throw new Error(error.message);
  return { success: true, subcategory: data };
}

export async function updateSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();

  if (!id) throw new Error('ID обязателен');
  if (!name) throw new Error('Название обязательно');

  if (!slug) slug = generateSlug(name);
  if (!slug) throw new Error('Slug обязателен');

  const payload: TablesUpdate<'subcategories'> = {
    name,
    slug,
    is_visible: cleanBool(formData.get('is_visible'), true),

    seo_h1: cleanText(formData.get('seo_h1')),
    seo_title: cleanText(formData.get('seo_title')),
    seo_description: cleanText(formData.get('seo_description')),
    seo_text: cleanText(formData.get('seo_text')),
    og_image: cleanText(formData.get('og_image')),
    seo_noindex: cleanBool(formData.get('seo_noindex'), false),
  };

  const { data, error } = await supabase
    .from('subcategories')
    .update(payload)
    .eq('id', id)
    .select('id,name,slug,category_id,is_visible,seo_h1,seo_title,seo_description,seo_text,og_image,seo_noindex')
    .single();

  if (error) throw new Error(error.message);
  return { success: true, subcategory: data };
}

export async function deleteSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID обязателен');

  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
}
