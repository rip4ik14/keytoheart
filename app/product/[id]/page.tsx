// файл: app/product/[id]/page.tsx
import { notFound } from 'next/navigation';
import Script from 'next/script';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types';
import ProductPageClient from './ProductPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

// 1) Предварительная сборка всех id для ISR
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data } = await supabase.from('products').select('id');
  return data?.map(({ id }) => ({ id: String(id) })) ?? [];
}

// 2) SEO‑метаданные
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: product } = await supabase
    .from('products')
    .select('title, price, short_desc')
    .eq('id', params.id)
    .single();

  if (!product) {
    return { title: 'Товар не найден | KeyToHeart' };
  }

  return {
    title: `${product.title} — ${product.price} ₽`,
    description: product.short_desc || product.title,
    openGraph: { images: [] },
  };
}

// 3) Страница товара
export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // 3.1) Основные данные товара
  const { data: product } = await supabase
    .from('products')
    .select(
      'id, title, price, category, short_desc, description, composition, images'
    )
    .eq('id', params.id)
    .single();
  if (!product) notFound();

  // 3.2) Комбо‑предложения
  const { data: upsells } = await supabase
    .from('upsell_items')
    .select('discount_percent, product:products(id, title, price, images)')
    .eq('base_id', product.id);

  const combos =
    upsells?.map((u) => {
      const p = u.product!;
      const oldPrice = Math.round(p.price / (1 - u.discount_percent! / 100));
      return {
        id: p.id,
        title: p.title,
        price: p.price,
        oldPrice,
        image: p.images[0] || '',
      };
    }) ?? [];

  // 3.3) JSON‑LD для SEO
  const ldJson = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: product.price,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <Script
        id="ld-json-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />
      <ProductPageClient product={product} combos={combos} />
    </>
  );
}
