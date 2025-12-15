'use server';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function addCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const is_visible = formData.get('is_visible') === 'true';

  if (!name.trim() || !slug.trim()) {
    throw new Error('Название и slug обязательны');
  }

  const { error } = await supabase.from('categories').insert({ name, slug, is_visible });
  if (error) throw new Error(error.message);

  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const is_visible = formData.get('is_visible') === 'true';

  if (!id || !name.trim() || !slug.trim()) {
    throw new Error('ID, название и slug обязательны');
  }

  const { error } = await supabase
    .from('categories')
    .update({ name, slug, is_visible })
    .eq('id', id);

  if (error) throw new Error(error.message);

  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('ID обязателен');
  }

  // Проверка наличия товаров с этой категорией
  const { data: products, error: productsError } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', id)
    .limit(1);

  if (productsError) throw new Error(productsError.message);
  if (products?.length) {
    throw new Error('Нельзя удалить категорию с товарами');
  }

  // Удаляем подкатегории
  const { error: subError } = await supabase
    .from('subcategories')
    .delete()
    .eq('category_id', id);

  if (subError) throw new Error(subError.message);

  // Удаляем категорию
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
}

export async function addSubcategory(formData: FormData) {
  const category_id = Number(formData.get('category_id'));
  const name = formData.get('name') as string;
  const is_visible = formData.get('is_visible') === 'true';

  if (!category_id || !name.trim()) {
    throw new Error('Категория и название обязательны');
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

  const { error } = await supabase
    .from('subcategories')
    .insert({ category_id, name, slug, is_visible });

  if (error) throw new Error(error.message);

  return { success: true };
}

export async function updateSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const is_visible = formData.get('is_visible') === 'true';
  let slug = formData.get('slug') as string | null;

  if (!id || !name.trim()) {
    throw new Error('ID и название обязательны');
  }

  // Генерируем slug если не пришёл
  if (!slug || !slug.trim()) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9а-я]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .replace(/-+/g, '-');
  }

  const { error } = await supabase
    .from('subcategories')
    .update({ name, slug, is_visible })
    .eq('id', id);

  if (error) throw new Error(error.message);

  return { success: true };
}

export async function deleteSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('ID обязателен');
  }

  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
}
