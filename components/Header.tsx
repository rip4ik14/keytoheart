import AuthStatus from '@components/AuthStatus';
import StickyHeader from '@components/StickyHeader';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Category } from '@/types/category';
import type { Database } from '@/lib/supabase/types_new';

export default async function Header() {
  // Создаём Supabase-клиент для проверки авторизации
  const supabase = createServerComponentClient<Database>({ cookies });

  // Получаем данные пользователя
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) console.error('Supabase getUser error:', userError);

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
    console.error('Ошибка загрузки категорий в Header:', error);
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
      <StickyHeader initialCategories={initialCategories} isAuthenticated={!!user} />
      <div className="container mx-auto px-4 py-2 flex justify-end items-center">
        <AuthStatus />
      </div>
    </header>
  );
}