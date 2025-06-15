// ✅  app/product/[id]/page.tsx  (замена целиком)
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { JsonLd } from 'react-schemaorg';
import type { Product as SchemaProduct, AggregateOffer } from 'schema-dts';
import type { Database } from '@/lib/supabase/types_new';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Breadcrumbs from '@components/Breadcrumbs';
import ProductPageClient from './ProductPageClient';
import { Product, ComboItem } from './types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*                              TYPES                                 */
/* ------------------------------------------------------------------ */
type RowFull = Database['public']['Tables']['products']['Row'] & {
  product_categories: { category_id: number }[]; // join-результат
};

/* ------------------------------------------------------------------ */
export async function generateStaticParams() {
  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('is_visible', true);
  return data?.map(p => ({ id: String(p.id) })) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = Number(params.id);
  if (Number.isNaN(id)) return {};

  const { data } = await supabase
    .from('products')
    .select('title, description, images')
    .eq('id', id)
    .single();

  if (!data) {
    return {
      title: 'Товар не найден | KeyToHeart',
      description: 'Страница товара не найдена.',
    };
  }

  const desc = (data.description ?? '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 160);

  const firstImg =
    Array.isArray(data.images) && data.images[0] ? data.images[0] : '/og-cover.webp';
  const url = `https://keytoheart.ru/product/${id}`;

  return {
    title: `${data.title} | KeyToHeart`,
    description: desc || undefined,
    openGraph: { title: data.title, description: desc, url, images: [{ url: firstImg }] },
    twitter: { card: 'summary_large_image', title: data.title, description: desc, images: [firstImg] },
    alternates: { canonical: url },
  };
}

/* ------------------------------------------------------------------ */
export default async function ProductPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  /* ---- один запрос с джойном категорий ---- */
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        *,
        product_categories(category_id)
      `,
    )
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
    category_ids: data.product_categories?.map(c => c.category_id) ?? [],
  };

  /* ---- апселлы ---- */
  const { data: upsells } = await supabase
    .from('upsell_items')
    .select('id, title, price, image_url');

  const combos: ComboItem[] =
    upsells?.map(u => ({
      id: Number(u.id),
      title: u.title,
      price: u.price,
      image: u.image_url ?? '',
    })) ?? [];

  const finalPrice =
    product.discount_percent && product.discount_percent > 0
      ? Math.round(product.price * (1 - product.discount_percent / 100))
      : product.price;

  const offer: AggregateOffer = {
    '@type': 'AggregateOffer',
    priceCurrency: 'RUB',
    lowPrice: finalPrice,
    highPrice: product.original_price ?? product.price,
    offerCount: 1,
    price: finalPrice,
    availability: 'https://schema.org/InStock',
  };

  return (
    <main aria-label={`Товар ${product.title}`}>
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
          brand: { '@type': 'Brand', name: 'KeyToHeart' },
          offers: offer,
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
