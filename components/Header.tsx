import AuthStatus from '@components/AuthStatus';
import StickyHeader from '@components/StickyHeader';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { Category } from '@/types/category'; // Импортируем тип Category

export default async function Header() {
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
    .eq('is_visible', true) // Фильтруем только видимые категории
    .order('id', { ascending: true });

  if (error) {
    console.error('Ошибка загрузки категорий в Header:', error);
    // Можно вернуть пустой массив или обработать ошибку иначе
  }

  // Форматируем данные категорий
  const initialCategories: Category[] = categoriesData
    ? categoriesData.map((cat) => ({
        ...cat,
        is_visible: cat.is_visible ?? true, // Преобразуем boolean | null в boolean
        subcategories: cat.subcategories
          ? cat.subcategories
              .filter((sub: any) => sub.is_visible === true) // Фильтруем только видимые подкатегории
              .map((sub: any) => ({
                ...sub,
                is_visible: sub.is_visible ?? true, // Преобразуем boolean | null в boolean
              }))
          : [],
      }))
    : [];

  return (
    <header aria-label="Шапка сайта">
      <StickyHeader initialCategories={initialCategories} />
      <div className="container mx-auto px-4 py-2 flex justify-end items-center">
        <AuthStatus />
      </div>
    </header>
  );
}