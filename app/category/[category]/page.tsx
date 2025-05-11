import { supabaseAdmin } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';
import CategoryPageClient from './CategoryPageClient';
import type { Product } from '@components/CatalogClient';
import type { Subcategory } from './CategoryPageClient';

const nameMap: Record<string, string> = {
  'klubnichnye-bukety': 'Клубничные букеты',
  'klubnichnye-boksy': 'Клубничные боксы',
  flowers: 'Цветы',
  combo: 'Комбо-наборы',
  premium: 'Premium',
  kollekcii: 'Коллекции',
  povod: 'Повод',
  podarki: 'Подарки',
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
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const apiName = nameMap[category];

  if (!apiName) {
    return (
      <main className="p-10 text-center text-red-600" aria-label="Ошибка">
        Категория «{category}» не найдена
      </main>
    );
  }

  const { data: categoryData, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('name', apiName)
    .single();

  if (categoryError || !categoryData) {
    console.error('Error fetching category ID:', categoryError);
    return (
      <main className="p-10 text-center text-red-600" aria-label="Ошибка">
        Категория «{apiName}» не найдена
      </main>
    );
  }

  const categoryId = categoryData.id;

  const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
    .from('subcategories')
    .select('id, name, slug')
    .eq('category_id', categoryId)
    .order('name', { ascending: true });

  if (subcategoriesError) {
    console.error('Error fetching subcategories:', subcategoriesError);
  }

  const subcategories: Subcategory[] = subcategoriesData ?? [];

  const { data: productsData, error: productsError } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      title,
      price,
      discount_percent,
      in_stock,
      images,
      category,
      subcategory_id,
      image_url,
      created_at,
      slug,
      bonus,
      short_desc,
      description,
      composition,
      is_popular,
      is_visible,
      category_id,
      subcategories!products_subcategory_id_fkey(id, name)
    `)
    .eq('category', apiName)
    .eq('in_stock', true)
    .order('id', { ascending: false });

  if (productsError) {
    console.error('CategoryPage products error:', productsError.message);
    return (
      <main className="p-10 text-center text-red-600" aria-label="Ошибка">
        Ошибка загрузки товаров: {productsError.message}
      </main>
    );
  }

  const products: Product[] = productsData?.map(product => ({
    id: product.id,
    title: product.title,
    price: product.price,
    discount_percent: product.discount_percent ?? null,
    original_price: undefined,
    in_stock: product.in_stock ?? null,
    images: product.images ?? [],
    category: product.category ?? null,
    subcategory_id: product.subcategory_id ?? null,
    image_url: product.image_url ?? null,
    created_at: product.created_at ?? null,
    slug: product.slug ?? null,
    bonus: product.bonus ?? null,
    short_desc: product.short_desc ?? null,
    description: product.description ?? null,
    composition: product.composition ?? null,
    is_popular: product.is_popular ?? null,
    is_visible: product.is_visible ?? null,
    category_id: product.category_id ?? null,
    subcategory_name: product.subcategories?.name ?? undefined,
  })) ?? [];

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

  return (data ?? []).map((cat) => ({
    category: cat.slug,
  }));
}
