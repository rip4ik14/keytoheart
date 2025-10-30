// app/2gis.json/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ProductRow = {
  id: number;
  title: string | null;
  price: number | null;
  images: string[] | null;
  slug: string | null;
  short_desc: string | null;
  description: string | null;
  product_categories: { category_id: number }[] | null;
};

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: productsData, error } = await supabase
    .from('products')
    .select('id, title, price, images, slug, short_desc, description, product_categories(category_id)')
    .eq('is_visible', true)
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const products: ProductRow[] = (productsData ?? []) as ProductRow[];

  const payload = products.map(p => ({
    id: p.id,
    name: p.title ?? `Товар #${p.id}`,
    price: Math.max(0, Number(p.price ?? 0)),
    url: `https://keytoheart.ru/product/${p.slug || p.id}`,
    image: p.images?.[0] || null,
    description: (p.short_desc || p.description || '')?.toString().replace(/<[^>]*>/g, ' ').trim() || ''
  }));

  return NextResponse.json(payload, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
}
