'use server';

import { prisma } from '@/lib/prisma';

export async function addCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const is_visible = formData.get('is_visible') === 'true';

  if (!name.trim() || !slug.trim()) {
    throw new Error('Название и slug обязательны');
  }

  try {
    await prisma.categories.create({ data: { name, slug, is_visible } });
  } catch (error: any) {
    throw new Error(error.message);
  }

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

  try {
    await prisma.categories.update({
      where: { id },
      data: { name, slug, is_visible },
    });
  } catch (error: any) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('ID обязателен');
  }

  // Проверка наличия товаров с этой категорией
  let productWithCategory;
  try {
    productWithCategory = await prisma.product_categories.findFirst({
      where: { category_id: id },
      select: { product_id: true },
    });
  } catch (error: any) {
    throw new Error(error.message);
  }

  if (productWithCategory) {
    throw new Error('Нельзя удалить категорию с товарами');
  }

  try {
    await prisma.subcategories.deleteMany({ where: { category_id: id } });
    await prisma.categories.delete({ where: { id } });
  } catch (error: any) {
    throw new Error(error.message);
  }

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

  try {
    await prisma.subcategories.create({
      data: { category_id, name, slug, is_visible },
    });
  } catch (error: any) {
    throw new Error(error.message);
  }

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

  try {
    await prisma.subcategories.update({
      where: { id },
      data: { name, slug, is_visible },
    });
  } catch (error: any) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function deleteSubcategory(formData: FormData) {
  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('ID обязателен');
  }

  try {
    await prisma.subcategories.delete({ where: { id } });
  } catch (error: any) {
    throw new Error(error.message);
  }

  return { success: true };
}
