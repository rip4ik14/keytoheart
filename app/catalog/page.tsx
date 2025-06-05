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
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки sitePages:', err);
      return [];
    }
  };

  // Загружаем категории из Supabase
  const fetchCategories = async (): Promise<CategoryFromDB[]> => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, is_visible');

      if (error) {
        throw new Error(`Ошибка загрузки категорий: ${error.message}`);
      }

      // Приводим is_visible к boolean с помощью значения по умолчанию
      return data?.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        is_visible: category.is_visible ?? true, // Приводим к boolean
      })) || [];
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки категорий:', err);
      return [];
    }
  };

  // Загружаем подкатегории из Supabase
  const fetchSubcategories = async (): Promise<SubcategoryFromDB[]> => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, slug, is_visible');

      if (error) {
        throw new Error(`Ошибка загрузки подкатегорий: ${error.message}`);
      }

      // Приводим is_visible к boolean с помощью значения по умолчанию
      return data?.map(subcategory => ({
        id: subcategory.id,
        name: subcategory.name,
        slug: subcategory.slug,
        is_visible: subcategory.is_visible ?? true, // Приводим к boolean
      })) || [];
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки подкатегорий:', err);
      return [];
    }
  };

  // Загружаем все товары из Supabase
  const fetchProducts = async (): Promise<Product[]> => {
    try {
      const start = Date.now();

      // Получаем связи товаров с категориями
      const { data: productCategoryData, error: productCategoryError } = await supabase
        .from('product_categories')
        .select('product_id, category_id');

      if (productCategoryError) {
        throw new Error(`Ошибка загрузки связей категорий: ${productCategoryError.message}`);
      }

      // Группируем category_ids по product_id
      const productCategoriesMap = new Map<number, number[]>();
      productCategoryData.forEach(item => {
        const existing = productCategoriesMap.get(item.product_id) || [];
        productCategoriesMap.set(item.product_id, [...existing, item.category_id]);
      });

      // Получаем связи товаров с подкатегориями
      const { data: productSubcategoryData, error: productSubcategoryError } = await supabase
        .from('product_subcategories')
        .select('product_id, subcategory_id');

      if (productSubcategoryError) {
        throw new Error(`Ошибка загрузки связей подкатегорий: ${productSubcategoryError.message}`);
      }

      // Группируем subcategory_ids по product_id
      const productSubcategoriesMap = new Map<number, number[]>();
      productSubcategoryData.forEach(item => {
        const existing = productSubcategoriesMap.get(item.product_id) || [];
        productSubcategoriesMap.set(item.product_id, [...existing, item.subcategory_id]);
      });

      // Получаем названия подкатегорий
      const allSubcategoryIds = Array.from(new Set(productSubcategoryData.map(item => item.subcategory_id)));
      const { data: subcategoryNamesData, error: subcategoryNamesError } = await supabase
        .from('subcategories')
        .select('id, name')
        .in('id', allSubcategoryIds.length > 0 ? allSubcategoryIds : [0]); // Избегаем пустого IN

      if (subcategoryNamesError) {
        throw new Error(`Ошибка загрузки названий подкатегорий: ${subcategoryNamesError.message}`);
      }

      const subcategoryNamesMap = new Map<number, string>();
      subcategoryNamesData.forEach(sub => subcategoryNamesMap.set(sub.id, sub.name));

      // Получаем все товары
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          original_price,
          discount_percent,
          images,
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
        `)
        .order('id', { ascending: true });

      process.env.NODE_ENV !== "production" && console.log('Supabase query duration for products:', Date.now() - start, 'ms');
      process.env.NODE_ENV !== "production" && console.log('Supabase fetch result:', { data, error });

      if (error) {
        throw new Error(`Supabase error: ${error.message || 'Неизвестная ошибка'} (code: ${error.code || 'N/A'}, details: ${error.details || 'N/A'}, hint: ${error.hint || 'N/A'})`);
      }

      if (!data || data.length === 0) {
        process.env.NODE_ENV !== "production" && console.warn('Товары не найдены в таблице products');
        return [];
      }

      return data.map(product => {
        const subcategoryIds = productSubcategoriesMap.get(product.id) || [];
        const subcategoryNames = subcategoryIds.map(id => subcategoryNamesMap.get(id) || '').filter(name => name);

        return {
          id: product.id,
          title: product.title || 'Без названия',
          price: product.price || 0,
          original_price: product.original_price ?? product.price,
          discount_percent: product.discount_percent ?? 0,
          images: Array.isArray(product.images) ? product.images : [],
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
          category_ids: productCategoriesMap.get(product.id) || [],
          subcategory_ids: subcategoryIds,
          subcategory_names: subcategoryNames,
        };
      });
    } catch (err: any) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки товаров:', {
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