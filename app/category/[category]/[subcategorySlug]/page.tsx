import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

import CategoryPageClient from '../CategoryPageClient';
import type { Product } from '@components/CatalogClient';

export const dynamicParams = true;
// можешь поставить 60/300 - как тебе по кэшу норм
export const revalidate = 60;

type Params = { category: string; subcategorySlug: string };

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // поддержка старого и нового нейминга ключа
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // если на сервере есть service role - можно использовать его (безопасно, т.к. это server-only файл)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || anon;

  if (!url || !key) {
    throw new Error(
      'Supabase env is missing. Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category: categorySlug, subcategorySlug } = await params;

  const supabase = getSupabaseServerClient();

  // 1) категория
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .maybeSingle();

  if (catErr) {
    console.error('[subcategory page] category error:', catErr);
    return notFound();
  }
  if (!category) return notFound();

  // 2) подкатегория (строго внутри категории)
  const { data: subcategory, error: subErr } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', category.id)
    .eq('slug', subcategorySlug)
    .maybeSingle();

  if (subErr) {
    console.error('[subcategory page] subcategory error:', subErr);
    return notFound();
  }
  if (!subcategory) return notFound();

  // 3) все подкатегории категории - для табов/пилюль на странице
  const { data: allSubcategories, error: allSubErr } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', category.id)
    .order('id', { ascending: true });

  if (allSubErr) {
    console.error('[subcategory page] allSubcategories error:', allSubErr);
    // не валим страницу - просто показываем текущую
  }

  // 4) товары подкатегории (через связку product_subcategories)
  const { data: links, error: linksErr } = await supabase
    .from('product_subcategories')
    .select('product:products(*)')
    .eq('subcategory_id', subcategory.id);

  if (linksErr) {
    console.error('[subcategory page] product_subcategories error:', linksErr);
    // не 404 - пусть просто будет пусто, как на категории
  }

  const products = ((links || [])
    .map((r: any) => r.product)
    .filter(Boolean)
    // мягкая фильтрация, чтобы не упасть, если колонок нет
    .filter((p: any) => p.is_visible !== false && p.is_available !== false)) as Product[];

  // Важно: НЕ делаем notFound при пустом списке - на /category/[category] у тебя так же
  return (
    <CategoryPageClient
      products={products}
      h1={(category as any)?.seo_h1 || category.name}
      slug={category.slug}
      subcategories={((allSubcategories || []).filter((s: any) => s.is_visible !== false) as any) || []}
      seoText={(subcategory as any)?.seo_text ?? null}
    />
  );
}
