import StickyHeader from '@components/StickyHeader';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Category } from '@/types/category';
import type { Database } from '@/lib/supabase/types_new';

export default async function Header() {
  // Создаём Supabase-клиент для загрузки категорий
  const supabase = createServerComponentClient<Database>({ cookies });

  // Загружаем категории из Supabase
  const { data: categoriesData, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      is_visible,
      subcategories!subcategories_category_id_fkey(id, name, slug, is_visible)
    `)
    .eq('is_visible', true)
    .order('id', { ascending: true });

  if (error) {
    process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} Header: Error loading categories`, error);
  }

  // Форматируем данные категорий
  const initialCategories: Category[] = categoriesData
    ? categoriesData.map((cat) => ({
        ...cat,
        is_visible: cat.is_visible ?? true,
        subcategories: cat.subcategories
          ? cat.subcategories
              .filter((sub: any) => sub.is_visible === true)
              .map((sub: any) => ({
                ...sub,
                is_visible: sub.is_visible ?? true,
              }))
          : [],
      }))
    : [];

  return (
    <header aria-label="Шапка сайта">
      <StickyHeader initialCategories={initialCategories} />
    </header>
  );
}