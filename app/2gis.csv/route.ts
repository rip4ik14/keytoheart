// app/2gis.csv/route.ts
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

type CategoryRow = { id: number; name: string };

function stripHtml(s = '') {
  return String(s).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
function csvEscape(v: string) {
  // 2ГИС нормально ест ; как разделитель. Экранируем кавычками.
  const val = v.replace(/\r?\n/g, ' ');
  return `"${val.replace(/"/g, '""')}"`;
}
function toFixedMoney(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2); // 2 знака
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  // необязательная наценка, напр. ?markup=10 (в процентах)
  const markupPct = Number(url.searchParams.get('markup') ?? '0');

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: categoriesData, error: catErr } = await supabase
    .from('categories')
    .select('id, name')
    .order('id', { ascending: true });

  if (catErr) {
    return NextResponse.json({ error: catErr.message }, { status: 500 });
  }
  const categories: CategoryRow[] = (categoriesData ?? []) as CategoryRow[];
  const catMap = new Map<number, string>();
  categories.forEach(c => catMap.set(c.id, c.name));

  const { data: productsData, error: prodErr } = await supabase
    .from('products')
    .select('id, title, price, images, slug, short_desc, description, product_categories(category_id)')
    .eq('is_visible', true)
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });

  if (prodErr) {
    return NextResponse.json({ error: prodErr.message }, { status: 500 });
  }
  const products: ProductRow[] = (productsData ?? []) as ProductRow[];

  // Заголовок CSV (разделитель — ;)
  const header = [
    'name',
    'price',
    'url',
    'image',
    'category',
    'description',
    'vendorCode'
  ].join(';');

  const rows = products.map(p => {
    const name = p.title?.trim() || `Товар #${p.id}`;
    const base = Math.max(0, Number(p.price ?? 0));
    const price = markupPct ? base * (1 + markupPct / 100) : base;

    const url = `https://keytoheart.ru/product/${p.slug || p.id}`;
    const image = p.images?.[0] || '';
    const catId = p.product_categories?.[0]?.category_id;
    const category = (catId && catMap.get(catId)) || '';

    const descSrc = p.short_desc?.trim() || p.description?.trim() || '';
    const desc = stripHtml(descSrc).slice(0, 300); // короче — стабильнее.

    return [
      csvEscape(name),
      csvEscape(toFixedMoney(price)),
      csvEscape(url),
      csvEscape(image),
      csvEscape(category),
      csvEscape(desc),
      csvEscape(String(p.id))
    ].join(';');
  });

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="keytoheart_2gis.csv"',
      'Cache-Control': 'no-store'
    }
  });
}
