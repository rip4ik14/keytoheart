import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { JsonLd } from 'react-schemaorg';
import type { Product as SchemaProduct } from 'schema-dts';
import type { Database } from '@/lib/supabase/types_new';
import type { Metadata } from 'next';
import Breadcrumbs from '@components/Breadcrumbs';
import ProductPageClient from './ProductPageClient';
import { Product } from '@/types/product';

const supabaseAnon = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ComboItem = {
  id: number;
  title: string;
  price: number;
  image: string;
};

export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const start = Date.now();
  const { data } = await supabaseAnon.from('products').select('id');
  console.log('Supabase query duration in generateStaticParams:', Date.now() - start, 'ms');
  return data?.map((p) => ({ id: String(p.id) })) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  const start = Date.now();
  const { data: product, error } = await supabaseAnon
    .from('products')
    .select('title, description')
    .eq('id', numericId)
    .single();
  console.log('Supabase query duration in generateMetadata:', Date.now() - start, 'ms');

  if (error || !product) {
    return {
      title: 'Товар не найден | KeyToHeart',
      description: 'Страница товара не найдена.',
    };
  }

  const productDescription: string | undefined = product.description === null ? undefined : product.description;
  return {
    title: `${product.title} | KeyToHeart`,
    description: productDescription ?? 'Купите клубничный букет с доставкой по Краснодару.',
    keywords: [product.title, 'KeyToHeart', 'клубничный букет'],
    openGraph: {
      title: product.title,
      description: productDescription ?? 'Купите клубничный букет с доставкой по Краснодару.',
      url: `https://keytoheart.ru/product/${id}`,
      images: [{ url: '/og-cover.jpg', width: 1200, height: 630 }],
    },
    alternates: { canonical: `https://keytoheart.ru/product/${id}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  console.log('Fetching product with ID:', numericId);
  const startProduct = Date.now();
  const { data: productData, error: productError } = await supabaseAnon
    .from('products')
    .select('id, title, price, original_price, discount_percent, images, description, composition, category, production_time')
    .eq('id', numericId)
    .single();
  console.log('Supabase query duration for product in ProductPage:', Date.now() - startProduct, 'ms');

  console.log('Product fetch result:', {
    productData,
    productError,
  });

  // Проверяем, есть ли ошибка или отсутствуют данные
  if (productError || !productData) {
    console.error('Product fetch error:', productError);
    notFound();
  }

  const validatedProduct: Product = {
    id: productData.id,
    title: productData.title || 'Без названия',
    price: productData.price || 0,
    original_price: productData.original_price ?? undefined,
    discount_percent: productData.discount_percent ?? 0,
    images: productData.images ?? [],
    description: productData.description ?? '',
    composition: productData.composition ?? '',
    category: productData.category,
    production_time: productData.production_time ?? null,
  };

  let combos: ComboItem[] = [];
  if (validatedProduct.category) {
    const startUpsells = Date.now();
    const { data: upsellItems, error: upsellsError } = await supabaseAnon
      .from('upsell_items')
      .select('id, title, price, image_url')
      .eq('category', validatedProduct.category);
    console.log('Supabase query duration for upsells in ProductPage:', Date.now() - startUpsells, 'ms');

    console.log('Upsells fetch result:', {
      upsellsData: upsellItems,
      upsellsError,
    });

    if (upsellsError) {
      console.error('Upsells fetch error:', upsellsError);
    }

    combos = upsellItems
      ? upsellItems.map((u) => ({
          id: parseInt(u.id, 10),
          title: u.title,
          price: u.price,
          image: u.image_url || '',
        }))
      : [];
  }

  const discountedPrice =
    validatedProduct.discount_percent != null && validatedProduct.discount_percent > 0
      ? Math.round(validatedProduct.price * (1 - validatedProduct.discount_percent / 100))
      : validatedProduct.price;

  return (
    <main aria-label={`Товар ${validatedProduct.title}`}>
      <JsonLd<SchemaProduct>
        item={{
          '@type': 'Product',
          name: validatedProduct.title,
          image: validatedProduct.images ?? undefined,
          description: validatedProduct.description ?? undefined,
          material: validatedProduct.composition ?? undefined,
          brand: { '@type': 'Brand', name: 'KeyToHeart' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'RUB',
            price: discountedPrice,
            availability: 'https://schema.org/InStock',
          },
        }}
      />
      <Breadcrumbs productTitle={validatedProduct.title} />
      <ProductPageClient product={validatedProduct} combos={combos} />
    </main>
  );
}