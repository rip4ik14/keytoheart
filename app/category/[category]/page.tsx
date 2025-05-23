import { supabaseAdmin } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';
import CategoryPageClient from './CategoryPageClient';
import { redirect } from 'next/navigation';

interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  original_price?: number | null;
  in_stock: boolean;
  images: string[];
  image_url: string | null;
  created_at: string | null;
  slug: string | null;
  bonus: number | null;
  short_desc: string | null;
  description: string | null;
  composition: string | null;
  is_popular: boolean;
  is_visible: boolean;
  category_ids: number[];
  subcategory_ids: number[];
  subcategory_names: string[];
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
}

const nameMap: Record<string, string> = {
  'klubnichnye-bukety': 'Клубничные букеты',
  'klubnichnye-boksy': 'Клубничные боксы',
  'flowers': 'Цветы',
  'combo': 'Комбо-наборы',
  'premium': 'Premium',
  'kollekcii': 'Коллекции',
  'povod': 'Повод',
  'podarki': 'Подарки',
  'club-box': 'Club Box',
  'roses': 'Roses',
  'mono-bouquets': 'Mono Bouquets',
  'wedding-bouquets': 'Wedding Bouquets',
  'author-bouquets': 'Author Bouquets',
  'pasha': 'Pasha',
  'vesna': 'Vesna',
  'arabia': 'Arabia',
  'kids': 'Kids',
  'men': 'Men',
  'mame': 'Mame',
  'lubimoi': 'Lubimoi',
  'muzhchine': 'Muzhchine',
  'detyam': 'Detyam',
  'uchitelyu': 'Uchitelyu',
  'kollege': 'Kollege',
  'wedding': 'Wedding',
  'bday': 'Bday',
  'vipusknoi': 'Vipusknoi',
  'birth': 'Birth',
  'care': 'Care',
  'balloons': 'Balloons',
  'gifts-nabori': 'Gifts Nabory',
  'cards': 'Cards',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const name = nameMap[category] ?? 'Категория';

  return {
    title: `${name} — купить с доставкой в Краснодаре`,
    description: `Свежие ${name.toLowerCase()} с доставкой по Краснодару. Онлайн-заказ за час.`,
    keywords: [name.toLowerCase(), 'KeyToHeart', 'доставка'],
    openGraph: {
      title: `${name} | KeyToHeart`,
      description: `Закажите ${name.toLowerCase()} с доставкой.`,
      url: `https://keytoheart.ru/category/${category}`,
    },
    alternates: { canonical: `https://keytoheart.ru/category/${category}` },
  };
}

export const revalidate = 300;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; subcategory?: string }>;
}) {
  const { category } = await params;
  const { sort = 'newest', subcategory: initialSubcategory = 'all' } = await searchParams;

  const apiName = nameMap[category];

  if (!apiName) {
    console.error(`Category ${category} not found in nameMap`);
    redirect('/404');
  }

  const { data: categoryData, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, is_visible')
    .eq('name', apiName)
    .eq('is_visible', true)
    .single();

  if (categoryError || !categoryData) {
    console.error(`Error fetching category ID for ${apiName}:`, categoryError?.message || 'No data');
    redirect('/404');
  }

  if (categoryData.slug !== category) {
    console.error(`Slug mismatch for category ${apiName}: expected ${categoryData.slug}, got ${category}`);
    redirect(`/category/${categoryData.slug}`);
  }

  const categoryId = categoryData.id;

  const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
    .from('subcategories')
    .select('id, name, slug, is_visible')
    .eq('category_id', categoryId)
    .eq('is_visible', true)
    .order('name', { ascending: true });

  if (subcategoriesError) {
    console.error('Error fetching subcategories:', subcategoriesError.message);
  }

  // Преобразуем is_visible из boolean | null в boolean
  const subcategories: Subcategory[] = subcategoriesData?.map((sub: any) => ({
    id: sub.id,
    name: sub.name,
    slug: sub.slug,
    is_visible: sub.is_visible ?? true, // Приводим к boolean
  })) ?? [];

  // Проверяем, если URL содержит подкатегорию (например, /category/klubnichnye-bukety/club-nabory)
  // и перенаправляем на корректный URL с параметром ?subcategory=...
  if (subcategories.length > 0) {
    const subcategoryFromUrl = subcategories.find((sub) => sub.slug === initialSubcategory);
    if (initialSubcategory !== 'all' && !subcategoryFromUrl) {
      // Если подкатегория в URL не найдена, перенаправляем на страницу категории без подкатегории
      redirect(`/category/${category}?sort=${sort}`);
    }
  }

  // Получаем ID товаров, связанных с категорией через product_categories
  const { data: productCategoryData, error: productCategoryError } = await supabaseAdmin
    .from('product_categories')
    .select('product_id')
    .eq('category_id', categoryId);

  if (productCategoryError || !productCategoryData) {
    console.error('Error fetching product IDs for category:', productCategoryError?.message || 'No data');
    redirect('/404');
  }

  const productIds = productCategoryData.map(item => item.product_id);

  if (productIds.length === 0) {
    // Если нет товаров в категории, можно вернуть пустой список
    return (
      <main aria-label={`Категория ${apiName}`}>
        <JsonLd<ItemList>
          item={{
            '@type': 'ItemList',
            itemListElement: [],
          }}
        />
        <CategoryPageClient
          products={[]}
          apiName={apiName}
          slug={category}
          subcategories={subcategories}
        />
      </main>
    );
  }

  // Получаем товары по найденным ID
  const { data: productsData, error: productsError } = await supabaseAdmin
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
      is_visible
    `)
    .in('id', productIds)
    .eq('in_stock', true)
    .eq('is_visible', true)
    .order('id', { ascending: false });

  if (productsError) {
    console.error('CategoryPage products error:', productsError.message);
    redirect('/404');
  }

  // Получаем связи с подкатегориями через product_subcategories
  const { data: productSubcategoryData, error: productSubcategoryError } = await supabaseAdmin
    .from('product_subcategories')
    .select('product_id, subcategory_id')
    .in('product_id', productIds);

  if (productSubcategoryError) {
    console.error('Error fetching product subcategories:', productSubcategoryError.message);
  }

  // Группируем подкатегории по товару
  const productSubcategoriesMap = new Map<number, number[]>();
  productSubcategoryData?.forEach(item => {
    const existing = productSubcategoriesMap.get(item.product_id) || [];
    productSubcategoriesMap.set(item.product_id, [...existing, item.subcategory_id]);
  });

  // Получаем названия подкатегорий
  const allSubcategoryIds = Array.from(new Set(productSubcategoryData?.map(item => item.subcategory_id) || []));
  const { data: subcategoryNamesData, error: subcategoryNamesError } = await supabaseAdmin
    .from('subcategories')
    .select('id, name')
    .in('id', allSubcategoryIds);

  if (subcategoryNamesError) {
    console.error('Error fetching subcategory names:', subcategoryNamesError.message);
  }

  const subcategoryNamesMap = new Map<number, string>();
  subcategoryNamesData?.forEach(sub => subcategoryNamesMap.set(sub.id, sub.name));

  const products: Product[] = productsData?.map((product) => {
    const subcategoryIds = productSubcategoriesMap.get(product.id) || [];
    const subcategoryNames = subcategoryIds.map(id => subcategoryNamesMap.get(id) || '').filter(name => name);

    return {
      id: product.id,
      title: product.title,
      price: product.price,
      discount_percent: product.discount_percent ?? null,
      original_price: undefined,
      in_stock: product.in_stock ?? true,
      images: product.images ?? [],
      image_url: product.image_url ?? null,
      created_at: product.created_at ?? null,
      slug: product.slug ?? null,
      bonus: product.bonus ?? null,
      short_desc: product.short_desc ?? null,
      description: product.description ?? null,
      composition: product.composition ?? null,
      is_popular: product.is_popular ?? false,
      is_visible: product.is_visible ?? true,
      category_ids: [categoryId], // Мы уже знаем, что товар принадлежит этой категории
      subcategory_ids: subcategoryIds,
      subcategory_names: subcategoryNames,
    };
  }) ?? [];

  return (
    <main aria-label={`Категория ${apiName}`}>
      <JsonLd<ItemList>
        item={{
          '@type': 'ItemList',
          itemListElement: products.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Product',
              name: p.title,
              url: `https://keytoheart.ru/product/${p.id}`,
              image: p.images && p.images.length > 0 ? p.images[0] : '',
              offers: {
                '@type': 'Offer',
                price: p.price,
                priceCurrency: 'RUB',
                availability: p.in_stock
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              },
            },
          })),
        }}
      />
      <CategoryPageClient
        products={products}
        apiName={apiName}
        slug={category}
        subcategories={subcategories}
      />
    </main>
  );
}

export async function generateStaticParams() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('slug')
    .eq('is_visible', true);

  if (error) {
    console.error('Ошибка получения категорий для generateStaticParams:', error.message);
    return [];
  }

  const paths = (data ?? []).map((cat) => ({
    category: cat.slug,
  }));

  console.log('Generated category paths:', paths);
  return paths;
}