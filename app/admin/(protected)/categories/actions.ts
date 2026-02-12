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
  if (v === 'true' || v === 'on' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  if (typeof v === 'boolean') return v;
  return fallback;
};

/* ------------------------------ SLUG ------------------------------ */

const translit = (input: string) => {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ы: 'y',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    ъ: '',
    ь: '',
  };

  return String(input ?? '')
    .trim()
    .split('')
    .map((ch) => map[ch.toLowerCase()] ?? ch)
    .join('');
};

const generateSlug = (name: string) =>
  translit(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

/**
 * Уникальный slug для categories.
 * excludeId - чтобы при update не ловить коллизию на самой себе.
 */
async function ensureUniqueCategorySlug(slug: string, excludeId?: number) {
  const base = slug;
  let counter = 1;
  let candidate = slug;

  // safety guard
  for (let i = 0; i < 200; i++) {
    const q = supabase.from('categories').select('id').eq('slug', candidate).maybeSingle();

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    if (!data) return candidate;
    if (excludeId && Number(data.id) === excludeId) return candidate;

    candidate = `${base}-${counter++}`;
  }

  throw new Error('Не удалось подобрать уникальный slug (categories)');
}

/**
 * Уникальный slug для subcategories внутри одной категории.
 * excludeId - чтобы при update не ловить коллизию на самой себе.
 */
async function ensureUniqueSubSlug(category_id: number, slug: string, excludeId?: number) {
  const base = slug;
  let counter = 1;
  let candidate = slug;

  for (let i = 0; i < 200; i++) {
    const { data, error } = await supabase
      .from('subcategories')
      .select('id')
      .eq('category_id', category_id)
      .eq('slug', candidate)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) return candidate;
    if (excludeId && Number(data.id) === excludeId) return candidate;

    candidate = `${base}-${counter++}`;
  }

  throw new Error('Не удалось подобрать уникальный slug (subcategories)');
}

/* ================= CATEGORY ================= */

export async function addCategory(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();
  const is_visible = cleanBool(formData.get('is_visible'), true);

  if (!name) throw new Error('Название обязательно');

  if (!slug) slug = generateSlug(name);
  else slug = generateSlug(slug); // чистим вручную введённый slug тоже

  slug = await ensureUniqueCategorySlug(slug);

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

  const { data, error } = await supabase.from('categories').insert(payload).select('*').single();
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
  else slug = generateSlug(slug);

  slug = await ensureUniqueCategorySlug(slug, id);

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

  const { error } = await supabase.from('categories').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID обязателен');

  // если в БД нет ON DELETE CASCADE, удаляем подкатегории вручную
  const { error: subErr } = await supabase.from('subcategories').delete().eq('category_id', id);
  if (subErr) throw new Error(subErr.message);

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
}

/* ================= SUBCATEGORY ================= */

export async function addSubcategory(formData: FormData) {
  const category_id = Number(formData.get('category_id'));
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();

  if (!category_id) throw new Error('Категория обязательна');
  if (!name) throw new Error('Название обязательно');

  if (!slug) slug = generateSlug(name);
  else slug = generateSlug(slug);

  slug = await ensureUniqueSubSlug(category_id, slug);

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

  const { data, error } = await supabase.from('subcategories').insert(payload).select('*').single();
  if (error) throw new Error(error.message);

  return { success: true, subcategory: data };
}

export async function updateSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();

  if (!id) throw new Error('ID обязателен');
  if (!name) throw new Error('Название обязательно');

  // Чтобы сделать уникальность корректно - надо знать category_id.
  // Мы его читаем из БД по id.
  const { data: existing, error: exErr } = await supabase
    .from('subcategories')
    .select('category_id')
    .eq('id', id)
    .single();

  if (exErr) throw new Error(exErr.message);

  const category_id = Number(existing.category_id);
  if (!category_id) throw new Error('Не удалось определить category_id подкатегории');

  if (!slug) slug = generateSlug(name);
  else slug = generateSlug(slug);

  slug = await ensureUniqueSubSlug(category_id, slug, id);

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

  const { error } = await supabase.from('subcategories').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
}

export async function deleteSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID обязателен');

  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
}
