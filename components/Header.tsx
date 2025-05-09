import AuthStatus from '@components/AuthStatus';
import StickyHeader from '@components/StickyHeader';
import { supabasePublic as supabase } from '@/lib/supabase/public';

// Определяем тип Category, чтобы он соответствовал StickyHeader
type Category = {
  id: number;
  name: string;
  slug: string;
  subcategories: { id: number; name: string; slug: string }[];
};

export default async function Header() {
  // Загружаем категории из Supabase
  const { data: categoriesData, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      subcategories!subcategories_category_id_fkey(id, name, slug)
    `)
    .order('id', { ascending: true });

  if (error) {
    console.error('Ошибка загрузки категорий в Header:', error);
    // Можно вернуть пустой массив или обработать ошибку иначе
  }

  // Форматируем данные категорий
  const initialCategories: Category[] = categoriesData
    ? categoriesData.map((cat) => ({
        ...cat,
        subcategories: cat.subcategories || [],
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