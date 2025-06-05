import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';
import { Suspense } from 'react';
import CategoryPageClient from './CategoryPageClient';
import { redirect } from 'next/navigation';
import type { Tables } from '@/lib/supabase/types_new';

interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  original_price: number | null | undefined;
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
  order_index: number | null;
  production_time: number | null;
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  category_id: number | null;
  label: string | null;
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
  const supabase = await createSupabaseServerClient();
  const { category } = await params;
  const { sort = 'newest', subcategory: initialSubcategory = 'all' } = await searchParams;

  const apiName = nameMap[category];

  if (!apiName) {
    process.env.NODE_ENV !== "production" && console.error(`Category ${category} not found in nameMap`);
    redirect('/404');
  }

  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, slug, is_visible')
    .eq('name', apiName)
    .eq('is_visible', true)
    .single();

  if (categoryError || !categoryData) {
    process.env.NODE_ENV !== "production" && console.error(`Error fetching category ID for ${apiName}:`, categoryError?.message || 'No data');
    redirect('/404');
  }

  if (categoryData.slug !== category) {
    process.env.NODE_ENV !== "production" && console.error(`Slug mismatch for category ${apiName}: expected ${categoryData.slug}, got ${category}`);
    redirect(`/category/${categoryData.slug}`);
  }

  const categoryId = categoryData.id;

  const { data: subcategoriesData, error: subcategoriesError } = await supabase
    .from('subcategories')
    .select('id, name, slug, is_visible, category_id, label')
    .eq('category_id', categoryId)
    .eq('is_visible', true)
    .order('name', { ascending: true });

  if (subcategoriesError) {
    process.env.NODE_ENV !== "production" && console.error('Error fetching subcategories:', subcategoriesError.message);
  }

  const subcategories: Subcategory[] = subcategoriesData?.map((sub: Tables<'subcategories'>) => ({
    id: sub.id,
    name: sub.name,
    slug: sub.slug,
    is_visible: sub.is_visible ?? true,
    category_id: sub.category_id,
    label: sub.label,
  })) ?? [];

  if (subcategories.length > 0) {
    const subcategoryFromUrl = subcategories.find((sub) => sub.slug === initialSubcategory);
    if (initialSubcategory !== 'all' && !subcategoryFromUrl) {
      redirect(`/category/${category}?sort=${sort}`);
    }
  }

  const { data: productCategoryData, error: productCategoryError } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', categoryId);

  if (productCategoryError || !productCategoryData) {
    process.env.NODE_ENV !== "production" && console.error('Error fetching product IDs for category:', productCategoryError?.message || 'No data');
    redirect('/404');
  }

  const productIds = productCategoryData.map((item: { product_id: number }) => item.product_id);

  if (productIds.length === 0) {
    return (
      <main aria-label={`Категория ${apiName}`}>
        <JsonLd<ItemList>
          item={{
            '@type': 'ItemList',
            itemListElement: [],
          }}
        />
        <Suspense fallback={<div>Загрузка...</div>}>
          <CategoryPageClient
            products={[]}
            apiName={apiName}
            slug={category}
            subcategories={subcategories}
          />
        </Suspense>
      </main>
    );
  }

  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      discount_percent,
      original_price,
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
      order_index,
      production_time
    `)
    .in('id', productIds)
    .eq('in_stock', true)
    .eq('is_visible', true)
    .order('id', { ascending: false });

  if (productsError) {
    process.env.NODE_ENV !== "production" && console.error('CategoryPage products error:', productsError.message);
    redirect('/404');
  }

  const { data: productSubcategoryData, error: productSubcategoryError } = await supabase
    .from('product_subcategories')
    .select('product_id, subcategory_id')
    .in('product_id', productIds);

  if (productSubcategoryError) {
    process.env.NODE_ENV !== "production" && console.error('Error fetching product subcategories:', productSubcategoryError.message);
  }

  const productSubcategoriesMap = new Map<number, number[]>();
  productSubcategoryData?.forEach((item: { product_id: number; subcategory_id: number }) => {
    const existing = productSubcategoriesMap.get(item.product_id) || [];
    productSubcategoriesMap.set(item.product_id, [...existing, item.subcategory_id]);
  });

  const allSubcategoryIds = Array.from(new Set(productSubcategoryData?.map((item: { subcategory_id: number }) => item.subcategory_id) || []));
  const { data: subcategoryNamesData, error: subcategoryNamesError } = await supabase
    .from('subcategories')
    .select('id, name')
    .in('id', allSubcategoryIds);

  if (subcategoryNamesError) {
    process.env.NODE_ENV !== "production" && console.error('Error fetching subcategory names:', subcategoryNamesError.message);
  }

  const subcategoryNamesMap = new Map<number, string>();
  subcategoryNamesData?.forEach((sub: { id: number; name: string }) => subcategoryNamesMap.set(sub.id, sub.name));

  const products: Product[] = productsData?.map((product: Tables<'products'>) => {
    const subcategoryIds = productSubcategoriesMap.get(product.id) || [];
    const subcategoryNames = subcategoryIds.map((id) => subcategoryNamesMap.get(id) || '').filter((name) => name);

    return {
      id: product.id,
      title: product.title,
      price: product.price,
      discount_percent: product.discount_percent ?? null,
      original_price: typeof product.original_price === 'string' ? parseFloat(product.original_price) : null,
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
      category_ids: [categoryId],
      subcategory_ids: subcategoryIds,
      subcategory_names: subcategoryNames,
      order_index: product.order_index ?? null,
      production_time: product.production_time ?? null,
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
      <Suspense fallback={<div>Загрузка...</div>}>
        <CategoryPageClient
          products={products}
          apiName={apiName}
          slug={category}
          subcategories={subcategories}
        />
      </Suspense>
    </main>
  );
}

export async function generateStaticParams() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('slug')
    .eq('is_visible', true);

  if (error) {
    process.env.NODE_ENV !== "production" && console.error('Ошибка получения категорий для generateStaticParams:', error.message);
    return [];
  }

  const paths = (data ?? []).map((cat: { slug: string }) => ({
    category: cat.slug,
  }));

  process.env.NODE_ENV !== "production" && console.log('Generated category paths:', paths);
  return paths;
}