import { Metadata } from 'next';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import CatalogClient, { Product, SitePage, CategoryFromDB, SubcategoryFromDB } from '@components/CatalogClient';

// Метаданные для SEO
export const metadata: Metadata = {
  title: 'Каталог товаров | KeyToHeart',
  description: 'Купите клубничные букеты и цветы с доставкой по Краснодару. Широкий выбор, свежие цветы, лучшие цены.',
  keywords: ['клубничные букеты', 'цветы', 'доставка Краснодар', 'KeyToHeart'],
  openGraph: {
    title: 'Каталог товаров | KeyToHeart',
    description: 'Купите клубничные букеты и цветы с доставкой по Краснодару.',
    url: 'https://keytoheart.ru/catalog',
    images: [{ url: '/og-cover.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://keytoheart.ru/catalog' },
};

export default async function CatalogPage() {
  // Загружаем sitePages из Supabase
  const fetchSitePages = async (): Promise<SitePage[]> => {
    try {
      const { data, error } = await supabase
        .from('site_pages')
        .select('label, href')
        .order('order_index');

      if (error) {
        throw new Error(`Ошибка загрузки site_pages: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Ошибка загрузки sitePages:', err);
      return [];
    }
  };

  // Загружаем категории из Supabase
  const fetchCategories = async (): Promise<CategoryFromDB[]> => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug');

      if (error) {
        throw new Error(`Ошибка загрузки категорий: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
      return [];
    }
  };

  // Загружаем подкатегории из Supabase
  const fetchSubcategories = async (): Promise<SubcategoryFromDB[]> => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, slug');

      if (error) {
        throw new Error(`Ошибка загрузки подкатегорий: ${error.message}`);
      }
      return data || [];
    } catch (err) {
      console.error('Ошибка загрузки подкатегорий:', err);
      return [];
    }
  };

  // Загружаем все товары из Supabase
  const fetchProducts = async (): Promise<Product[]> => {
    try {
      const start = Date.now();

      // Основной запрос с JOIN на таблицы subcategories и categories
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          original_price,
          discount_percent,
          images,
          category,
          category_id,
          subcategory_id,
          subcategories!products_subcategory_id_fkey(id, name),
          image_url,
          created_at,
          slug,
          bonus,
          short_desc,
          description,
          composition,
          is_popular,
          is_visible,
          in_stock
        `) // Добавляем все необходимые поля
        .order('id', { ascending: true });

      console.log('Supabase query duration for products:', Date.now() - start, 'ms');
      console.log('Supabase fetch result:', { data, error });

      if (error) {
        throw new Error(`Supabase error: ${error.message || 'Неизвестная ошибка'} (code: ${error.code || 'N/A'}, details: ${error.details || 'N/A'}, hint: ${error.hint || 'N/A'})`);
      }

      if (!data || data.length === 0) {
        console.warn('Товары не найдены в таблице products');
        return [];
      }

      return data.map(product => ({
        id: product.id,
        title: product.title || 'Без названия',
        price: product.price || 0,
        original_price: product.original_price ?? product.price,
        discount_percent: product.discount_percent ?? 0,
        images: Array.isArray(product.images) ? product.images : [],
        category: product.category || '',
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
        subcategory_name: product.subcategories?.name || '',
        image_url: product.image_url ?? null,
        created_at: product.created_at ?? null,
        slug: product.slug ?? null,
        bonus: product.bonus ?? null,
        short_desc: product.short_desc ?? null,
        description: product.description ?? null,
        composition: product.composition ?? null,
        is_popular: product.is_popular ?? null,
        is_visible: product.is_visible ?? null,
        in_stock: product.in_stock ?? null,
      }));
    } catch (err: any) {
      console.error('Ошибка загрузки товаров:', {
        message: err.message || 'Неизвестная ошибка',
        stack: err.stack || 'Нет стека',
        details: err.details || 'Нет деталей',
        name: err.name || 'Нет имени',
      });
      return [];
    }
  };

  // Загружаем данные параллельно
  const [products, sitePages, subcategoriesDB, categoriesDB] = await Promise.all([
    fetchProducts(),
    fetchSitePages(),
    fetchSubcategories(),
    fetchCategories(),
  ]);

  return (
    <CatalogClient
      initialProducts={products}
      initialSitePages={sitePages}
      initialSubcategoriesDB={subcategoriesDB}
      categoriesDB={categoriesDB}
    />
  );
}