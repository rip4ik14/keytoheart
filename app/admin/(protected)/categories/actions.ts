// ✅ Путь: app/admin/(protected)/categories/actions.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/* ------------------------------ helpers ------------------------------ */

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

const cleanInt = (v: unknown, fallback = 0) => {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

/* ------------------------------ slug ------------------------------ */

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

async function ensureUniqueCategorySlug(slug: string, excludeId?: number) {
  const base = slug;
  let counter = 1;
  let candidate = slug;

  for (let i = 0; i < 200; i++) {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) return candidate;
    if (excludeId && Number((data as any).id) === excludeId) return candidate;

    candidate = `${base}-${counter++}`;
  }

  throw new Error('Не удалось подобрать уникальный slug (categories)');
}

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
    if (excludeId && Number((data as any).id) === excludeId) return candidate;

    candidate = `${base}-${counter++}`;
  }

  throw new Error('Не удалось подобрать уникальный slug (subcategories)');
}

/* ================= CATEGORY ================= */

export async function addCategory(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();

  if (!name) throw new Error('Название обязательно');

  slug = generateSlug(slug || name);
  slug = await ensureUniqueCategorySlug(slug);

  const payload: TablesInsert<'categories'> = {
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

  const { data, error } = await supabase.from('categories').insert(payload).select('*').single();
  if (error) throw new Error(error.message);

  revalidatePath('/admin/categories');
  revalidatePath('/');

  return { success: true, category: data };
}

export async function updateCategory(formData: FormData) {
  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();

  if (!id) throw new Error('ID обязателен');
  if (!name) throw new Error('Название обязательно');

  slug = generateSlug(slug || name);
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

  revalidatePath('/admin/categories');
  revalidatePath('/');

  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID обязателен');

  const { error: subErr } = await supabase.from('subcategories').delete().eq('category_id', id);
  if (subErr) throw new Error(subErr.message);

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/categories');
  revalidatePath('/');

  return { success: true };
}

/* ================= SUBCATEGORY ================= */

export async function addSubcategory(formData: FormData) {
  const category_id = Number(formData.get('category_id'));
  const name = String(formData.get('name') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();

  if (!category_id) throw new Error('Категория обязательна');
  if (!name) throw new Error('Название обязательно');

  slug = generateSlug(slug || name);
  slug = await ensureUniqueSubSlug(category_id, slug);

  const payload: any = {
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

    // ✅ универсальная картинка/иконка подкатегории
    image_url: cleanText(formData.get('image_url')),

    home_is_featured: cleanBool(formData.get('home_is_featured'), false),
    home_sort: Math.max(0, cleanInt(formData.get('home_sort'), 0)),
    home_icon_url: cleanText(formData.get('home_icon_url')),
    home_title: cleanText(formData.get('home_title')),
  };

  const { data, error } = await supabase.from('subcategories').insert(payload).select('*').single();
  if (error) throw new Error(error.message);

  revalidatePath('/admin/categories');
  revalidatePath('/');

  return { success: true, subcategory: data };
}

/**
 * ✅ ФИКС:
 * Не используем formData.has('home_*'), потому что в server actions это может не сработать.
 * Используем formData.get(...) !== null.
 */
export async function updateSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID обязателен');

  // тянем текущую запись - чтобы иметь category_id и дефолты
  const { data: existing, error: exErr } = await supabase
    .from('subcategories')
    .select(
      'category_id,name,slug,is_visible,image_url,seo_h1,seo_title,seo_description,seo_text,og_image,seo_noindex,home_is_featured,home_sort,home_icon_url,home_title',
    )
    .eq('id', id)
    .single();

  if (exErr) throw new Error(exErr.message);

  const category_id = Number((existing as any).category_id);
  if (!category_id) throw new Error('Не удалось определить category_id подкатегории');

  // name обязателен, берем из formData либо из базы
  const nameRaw = formData.get('name');
  const name = String((nameRaw ?? (existing as any).name) ?? '').trim();
  if (!name) throw new Error('Название обязательно');

  // slug: если пришел - пересобираем, если нет - оставляем текущий
  const slugRaw = formData.get('slug');
  let slug =
    slugRaw !== null ? String(slugRaw ?? '').trim() : String((existing as any).slug ?? '').trim();

  slug = generateSlug(slug || name);
  slug = await ensureUniqueSubSlug(category_id, slug, id);

  const payload: any = { name, slug };

  // is_visible / seo_* обновляем только если ключ пришел
  const vIsVisible = formData.get('is_visible');
  if (vIsVisible !== null) payload.is_visible = cleanBool(vIsVisible, true);

  const vSeoH1 = formData.get('seo_h1');
  if (vSeoH1 !== null) payload.seo_h1 = cleanText(vSeoH1);

  const vSeoTitle = formData.get('seo_title');
  if (vSeoTitle !== null) payload.seo_title = cleanText(vSeoTitle);

  const vSeoDesc = formData.get('seo_description');
  if (vSeoDesc !== null) payload.seo_description = cleanText(vSeoDesc);

  const vSeoText = formData.get('seo_text');
  if (vSeoText !== null) payload.seo_text = cleanText(vSeoText);

  const vOg = formData.get('og_image');
  if (vOg !== null) payload.og_image = cleanText(vOg);

  const vNoindex = formData.get('seo_noindex');
  if (vNoindex !== null) payload.seo_noindex = cleanBool(vNoindex, false);

  // ✅ image_url
  const vImageUrl = formData.get('image_url');
  if (vImageUrl !== null) payload.image_url = cleanText(vImageUrl);

  // home_* - ключевой фикс
  const vHomeFeatured = formData.get('home_is_featured');
  if (vHomeFeatured !== null) payload.home_is_featured = cleanBool(vHomeFeatured, false);

  const vHomeSort = formData.get('home_sort');
  if (vHomeSort !== null) payload.home_sort = Math.max(0, cleanInt(vHomeSort, 0));

  const vHomeTitle = formData.get('home_title');
  if (vHomeTitle !== null) payload.home_title = cleanText(vHomeTitle);

  const vHomeIcon = formData.get('home_icon_url');
  if (vHomeIcon !== null) payload.home_icon_url = cleanText(vHomeIcon);

  const { error } = await supabase.from('subcategories').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/categories');
  revalidatePath('/');
  revalidatePath('/category/povod');

  return { success: true };
}

export async function deleteSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID обязателен');

  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/categories');
  revalidatePath('/');

  return { success: true };
}
