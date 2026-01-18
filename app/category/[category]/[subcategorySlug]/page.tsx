// ✅ Путь: app/category/[category]/[subcategorySlug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import ProductCard from '@components/ProductCard';
import Breadcrumbs from '@components/Breadcrumbs';

type SeoRow = {
  seo_h1: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_text: string | null;
  og_image: string | null;
  seo_noindex: boolean | null;
};

export async function generateMetadata({
  params,
}: {
  params: { category: string; subcategorySlug: string };
}): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies });

  const { data: category } = await supabase
    .from('categories')
    .select('id,name,slug,is_visible,seo_h1,seo_title,seo_description,seo_text,og_image,seo_noindex')
    .eq('slug', params.category)
    .maybeSingle<SeoRow & { id: number; name: string; slug: string; is_visible: boolean }>();

  if (!category || category.is_visible === false) return {};

  const { data: sub } = await supabase
    .from('subcategories')
    .select('id,name,slug,is_visible,seo_h1,seo_title,seo_description,seo_text,og_image,seo_noindex,category_id')
    .eq('category_id', category.id)
    .eq('slug', params.subcategorySlug)
    .maybeSingle<SeoRow & { id: number; name: string; slug: string; is_visible: boolean; category_id: number }>();

  if (!sub || sub.is_visible === false) return {};

  const titleBase =
    sub.seo_title?.trim() ||
    `${sub.name} - ${category.name} с доставкой в Краснодаре`;

  const title = titleBase;

  const description =
    sub.seo_description?.trim() ||
    `Закажите "${sub.name}" в категории "${category.name}" с доставкой по Краснодару. Фото перед отправкой, аккуратная упаковка.`;

  const canonical = `https://keytoheart.ru/category/${category.slug}/${sub.slug}`;

  const robots = sub.seo_noindex ? { index: false, follow: false } : { index: true, follow: true };

  return {
    title,
    description,
    alternates: { canonical },
    robots,
    openGraph: {
      title: titleBase,
      description,
      url: canonical,
      type: 'website',
      images: [
        {
          url: sub.og_image?.trim() || category.og_image?.trim() || 'https://keytoheart.ru/og-default.webp',
          width: 1200,
          height: 630,
          alt: `${sub.name} | KeyToHeart`,
        },
      ],
    },
  };
}

async function getProductsForSubcategory(supabase: any, subcategoryId: number) {
  // Вариант A: products.subcategory_id
  const { data: direct, error: directErr } = await supabase
    .from('products')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .eq('is_visible', true)
    .eq('in_stock', true)
    .order('id', { ascending: false });

  if (!directErr && Array.isArray(direct)) return direct;

  // Вариант B: product_subcategories
  const { data: links, error: linksErr } = await supabase
    .from('product_subcategories')
    .select('product_id')
    .eq('subcategory_id', subcategoryId);

  if (linksErr || !links?.length) return direct || [];

  const ids = links.map((x: any) => x.product_id).filter(Boolean);

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', ids)
    .eq('is_visible', true)
    .eq('in_stock', true)
    .order('id', { ascending: false });

  return products || [];
}

export default async function SubcategoryPage({
  params,
}: {
  params: { category: string; subcategorySlug: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  const { data: category } = await supabase
    .from('categories')
    .select('id,name,slug,is_visible')
    .eq('slug', params.category)
    .maybeSingle();

  if (!category || category.is_visible === false) return notFound();

  const { data: sub } = await supabase
    .from('subcategories')
    .select('id,name,slug,is_visible,seo_h1,seo_text')
    .eq('category_id', category.id)
    .eq('slug', params.subcategorySlug)
    .maybeSingle();

  if (!sub || sub.is_visible === false) return notFound();

  const products = await getProductsForSubcategory(supabase, sub.id);

  const h1 = (sub.seo_h1 || sub.name || '').trim();

  return (
    <main className="container mx-auto px-4 py-6" id="main-content">
      {/* ✅ Breadcrumbs сам строит путь по URL */}
      

      <h1 className="text-2xl md:text-3xl font-semibold text-black mt-4">{h1}</h1>

      <section className="mt-6">
        {products?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6 text-gray-600">
            Товары в этой подкатегории пока не добавлены.
          </div>
        )}
      </section>

      {sub.seo_text?.trim() ? (
        <section className="mt-10 prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: sub.seo_text }} />
        </section>
      ) : null}
    </main>
  );
}
