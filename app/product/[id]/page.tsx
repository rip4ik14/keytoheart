/* -------------------------------------------------------------------------- */
/*  Страница товара (SSR + Supabase, фикс типов cookies + JSON-LD)            */
/* -------------------------------------------------------------------------- */
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { JsonLd } from 'react-schemaorg';
import type {
  Product as SchemaProduct,
  AggregateOffer,
  BreadcrumbList,
} from 'schema-dts';
import type { Database } from '@/lib/supabase/types_new';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import Breadcrumbs from '@components/Breadcrumbs';
import ProductPageClient from './ProductPageClient';
import { Product, ComboItem } from './types';

/* ------------------------------------------------------------------ */
/*  Анонимный клиент (используем в SSG-методах, cookie не нужны)       */
/* ------------------------------------------------------------------ */
const supabaseAnon = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const revalidate = 3600; // 1 ч

type RowFull = Database['public']['Tables']['products']['Row'] & {
  product_categories: { category_id: number }[];
};

/* ------------------------ SSG: generate paths ---------------------- */
export async function generateStaticParams() {
  const { data } = await supabaseAnon
    .from('products')
    .select('id')
    .eq('is_visible', true);

  return data?.map((p) => ({ id: String(p.id) })) ?? [];
}

/* ----------------------- SSG: generate <head> ---------------------- */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = Number(params.id);
  if (Number.isNaN(id)) return {};

  const { data } = await supabaseAnon
    .from('products')
    .select('title, description, images')
    .eq('id', id)
    .single();

  if (!data) {
    return {
      title: 'Товар не найден | KEY TO HEART',
      description: 'Страница товара не найдена.',
      robots: { index: false, follow: false },
    };
  }

  const desc = (data.description ?? '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 160);

  const firstImg =
    Array.isArray(data.images) && data.images[0]
      ? data.images[0]
      : '/og-cover.webp';

  const url = `https://keytoheart.ru/product/${id}`;

  return {
    title: `${data.title} | KEY TO HEART`,
    description: desc || undefined,
    openGraph: {
      title: data.title,
      description: desc,
      url,
      images: [{ url: firstImg }],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: desc,
      images: [firstImg],
    },
    alternates: { canonical: url },
  };
}

/* ------------------------------------------------------------------ */
/*                                Page                                */
/* ------------------------------------------------------------------ */
export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  /* ---------- SSR-клиент Supabase с cookie-контекстом ---------- */
  const cookieStore = await cookies(); // ← FIX: await, получаем ReadonlyRequestCookies

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({
            name,
            value,
          }));
        },
      },
    },
  );

  /* ---------- Продукт + join категорий ---------- */
  const { data, error } = await supabase
    .from('products')
    .select('*, product_categories(category_id)')
    .eq('id', id)
    .eq('is_visible', true)
    .single<RowFull>();

  if (error || !data || data.in_stock === false) notFound();

  const product: Product = {
    id: data.id,
    title: data.title ?? 'Без названия',
    price: data.price ?? 0,
    original_price: data.original_price ?? undefined,
    discount_percent: data.discount_percent ?? 0,
    images: data.images ?? [],
    description: data.description ?? '',
    composition: data.composition ?? '',
    production_time: data.production_time ?? null,
    category_ids: data.product_categories?.map((c) => c.category_id) ?? [],
  };

  /* ---------- Апселлы (fail-silent) ---------- */
  let combos: ComboItem[] = [];
  try {
    const { data: upsells } = await supabase
      .from('upsell_items')
      .select('id, title, price, image_url');

    combos =
      upsells?.map((u) => ({
        id: Number(u.id),
        title: u.title,
        price: u.price,
        image: u.image_url ?? '',
      })) ?? [];
  } catch (e) {
    process.env.NODE_ENV !== 'production' &&
      console.error('upsell_items →', e);
  }

  /* ---------- Offer для Schema.org ---------- */
  const finalPrice =
    product.discount_percent && product.discount_percent > 0
      ? Math.round(product.price * (1 - product.discount_percent / 100))
      : product.price;

  const offer: AggregateOffer = {
    '@type': 'AggregateOffer',
    priceCurrency: 'RUB',
    lowPrice: finalPrice,
    highPrice: product.original_price ?? product.price,
    price: finalPrice,
    offerCount: 1,
    availability: 'https://schema.org/InStock',
    priceValidUntil: new Date(Date.now() + 12096e5) // +14 дней
      .toISOString()
      .split('T')[0],
  };

  /* ------------------------------------------------------------------ */
  return (
    <main aria-label={`Товар ${product.title}`}>
      {/* --- Product JSON-LD --- */}
      <JsonLd<SchemaProduct>
        item={{
          '@type': 'Product',
          sku: String(product.id),
          name: product.title,
          url: `https://keytoheart.ru/product/${product.id}`,
          image: product.images.length ? product.images : undefined,
          description: product.description || undefined,
          material: product.composition || undefined,
          category: product.category_ids.join(',') || undefined,
          brand: { '@type': 'Brand', name: 'KEY TO HEART' },
          offers: offer,
        }}
      />

      {/* --- BreadcrumbList JSON-LD --- */}
      <JsonLd<BreadcrumbList>
        item={{
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Главная',
              item: 'https://keytoheart.ru',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: product.title,
              item: `https://keytoheart.ru/product/${product.id}`,
            },
          ],
        }}
      />

      <Suspense fallback={null}>
        <Breadcrumbs productTitle={product.title} />
      </Suspense>

      <Suspense fallback={<div className="text-center py-8">Загрузка…</div>}>
        <ProductPageClient product={product} combos={combos} />
      </Suspense>
    </main>
  );
}
