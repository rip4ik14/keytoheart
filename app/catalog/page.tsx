// ✅ Путь: app/catalog/page.tsx
import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';
import CatalogClient from '@components/CatalogClient';
import { Product } from '@/types/product';
import { type CategoryFromDB, type SubcategoryFromDB, type SitePage } from '@components/CatalogClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Каталог товаров | KeyToHeart',
  description: 'Ознакомьтесь с нашим ассортиментом клубничных букетов, цветов и подарков с доставкой по Краснодару.',
  keywords: ['клубничные букеты', 'цветы Краснодар', 'подарки Краснодар', 'KeyToHeart'],
  openGraph: {
    title: 'Каталог товаров | KeyToHeart',
    description: 'Ознакомьтесь с нашим ассортиментом клубничных букетов, цветов и подарков.',
    url: 'https://keytoheart.ru/catalog',
    images: [{ url: '/og-cover.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://keytoheart.ru/catalog' },
};

export default async function CatalogPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  let products: Product[] = [];
  let categories: CategoryFromDB[] = [];
  let subcategories: SubcategoryFromDB[] = [];
  let sitePages: SitePage[] = [];

  try {
    // Получаем связи товаров с категориями
    const { data: productCategoryData, error: productCategoryError } = await supabase
      .from('product_categories')
      .select('product_id, category_id')
      .neq('category_id', 38); // Исключаем "Без категории"

    if (productCategoryError) throw new Error(`Ошибка загрузки категорий: ${productCategoryError.message}`);

    // Группируем category_ids по product_id
    const productCategoriesMap = new Map<number, number[]>();
    productCategoryData.forEach((item) => {
      const existing = productCategoriesMap.get(item.product_id) || [];
      productCategoriesMap.set(item.product_id, [...existing, item.category_id]);
    });

    // Получаем связи товаров с подкатегориями
    const { data: productSubcategoryData, error: productSubcategoryError } = await supabase
      .from('product_subcategories')
      .select('product_id, subcategory_id');

    if (productSubcategoryError) throw new Error(`Ошибка загрузки подкатегорий: ${productSubcategoryError.message}`);

    // Группируем subcategory_ids по product_id
    const productSubcategoriesMap = new Map<number, number[]>();
    productSubcategoryData.forEach((item) => {
      const existing = productSubcategoriesMap.get(item.product_id) || [];
      productSubcategoriesMap.set(item.product_id, [...existing, item.subcategory_id]);
    });

    // Получаем названия подкатегорий
    const allSubcategoryIds = Array.from(new Set(productSubcategoryData.map((item) => item.subcategory_id)));
    const { data: subcategoryNamesData, error: subcategoryNamesError } = await supabase
      .from('subcategories')
      .select('id, name')
      .in('id', allSubcategoryIds.length > 0 ? allSubcategoryIds : [0]);

    if (subcategoryNamesError) throw new Error(`Ошибка загрузки названий подкатегорий: ${subcategoryNamesError.message}`);

    const subcategoryNamesMap = new Map<number, string>();
    subcategoryNamesData.forEach((sub) => subcategoryNamesMap.set(sub.id, sub.name));

    const productIds = Array.from(productCategoriesMap.keys());

    // Получаем товары
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        discount_percent,
        in_stock,
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
        original_price,
        order_index,
        production_time
      `)
      .in('id', productIds.length > 0 ? productIds : [0])
      .eq('in_stock', true)
      .eq('is_visible', true)
      .order('id', { ascending: false });

    if (productsError) throw new Error(`Ошибка загрузки товаров: ${productsError.message}`);

    products = productsData?.map((product) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      discount_percent: product.discount_percent,
      original_price: typeof product.original_price === 'string' ? parseFloat(product.original_price) || null : product.original_price,
      in_stock: product.in_stock,
      images: product.images ?? [],
      image_url: product.image_url,
      created_at: product.created_at,
      slug: product.slug,
      bonus: product.bonus,
      short_desc: product.short_desc,
      description: product.description,
      composition: product.composition,
      is_popular: product.is_popular,
      is_visible: product.is_visible,
      category_ids: productCategoriesMap.get(product.id) || [],
      subcategory_ids: productSubcategoriesMap.get(product.id) || [],
      subcategory_names: (productSubcategoriesMap.get(product.id) || []).map((id) => subcategoryNamesMap.get(id) || '').filter(Boolean),
      production_time: product.production_time,
      order_index: product.order_index,
    })) ?? [];

    // Получаем категории
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, is_visible')
      .eq('is_visible', true)
      .neq('id', 38); // Исключаем "Без категории"

    if (categoriesError) throw new Error(`Ошибка загрузки категорий: ${categoriesError.message}`);

    categories = categoriesData?.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      is_visible: category.is_visible ?? false, // Обрабатываем null
    })) ?? [];

    // Получаем подкатегории
    const { data: subcategoriesData, error: subcategoriesError } = await supabase
      .from('subcategories')
      .select('id, name, slug, is_visible')
      .eq('is_visible', true);

    if (subcategoriesError) throw new Error(`Ошибка загрузки подкатегорий: ${subcategoriesError.message}`);

    subcategories = subcategoriesData?.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      slug: subcategory.slug,
      is_visible: subcategory.is_visible ?? false, // Обрабатываем null
    })) ?? [];

    // Получаем страницы сайта
    const { data: sitePagesData, error: sitePagesError } = await supabase
      .from('site_pages')
      .select('label, href');

    if (sitePagesError) throw new Error(`Ошибка загрузки страниц сайта: ${sitePagesError.message}`);

    sitePages = sitePagesData ?? [];
  } catch (err: any) {
    console.error('Ошибка загрузки данных каталога:', err);
  }

  return (
    <main aria-label="Каталог товаров">
      <CatalogClient
        initialProducts={products}
        initialSitePages={sitePages}
        initialSubcategoriesDB={subcategories}
        categoriesDB={categories}
      />
    </main>
  );
}