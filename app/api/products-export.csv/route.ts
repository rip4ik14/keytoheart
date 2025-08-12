// app/api/products-export.csv/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** CSV helpers */
function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  // экранируем двойные кавычки и всегда оборачиваем в кавычки
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ').trim()}"`;
}
function toCsv(rows: string[][]): string {
  const BOM = '\uFEFF'; // чтобы Excel не ломал кириллицу
  return BOM + rows.map(r => r.join(',')).join('\r\n') + '\r\n';
}

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1) Берём продукты
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select(
      'id,title,slug,composition,short_desc,description,is_visible'
    )
    .order('id', { ascending: true });

  if (prodErr) {
    return NextResponse.json({ error: prodErr.message }, { status: 500 });
  }

  // 2) Связки product_categories
  const { data: pc, error: pcErr } = await supabase
    .from('product_categories')
    .select('product_id, category_id');

  if (pcErr) {
    return NextResponse.json({ error: pcErr.message }, { status: 500 });
  }

  // 3) Категории
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id,name');

  if (catErr) {
    return NextResponse.json({ error: catErr.message }, { status: 500 });
  }

  // 4) Подкатегории (если используются)
  const { data: sc, error: scErr } = await supabase
    .from('subcategory_connections')
    .select('product_id, subcategory_id');

  if (scErr) {
    return NextResponse.json({ error: scErr.message }, { status: 500 });
  }

  const { data: subcategories, error: subErr } = await supabase
    .from('subcategories')
    .select('id,name');

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // Мапы для быстрого доступа
  const catNameById = new Map<number, string>(
    (categories ?? []).map(c => [c.id, c.name])
  );
  const subNameById = new Map<number, string>(
    (subcategories ?? []).map(s => [s.id, s.name])
  );

  const catIdsByProduct = new Map<number, number[]>();
  (pc ?? []).forEach(({ product_id, category_id }) => {
    const arr = catIdsByProduct.get(product_id) ?? [];
    catIdsByProduct.set(product_id, [...arr, category_id]);
  });

  const subIdsByProduct = new Map<number, number[]>();
  (sc ?? []).forEach(({ product_id, subcategory_id }) => {
    const arr = subIdsByProduct.get(product_id) ?? [];
    subIdsByProduct.set(product_id, [...arr, subcategory_id]);
  });

  // Шапка CSV
  const header = [
    'id',
    'title',
    'slug',
    'categories',
    'subcategories',
    'composition',
    'short_desc',
    'description',
  ];

  // Тело CSV
  const rows: string[][] = [header.map(csvEscape)];

  (products ?? []).forEach(p => {
    // только видимые можно оставить, либо выгружать все — по желанию
    // если нужен только видимые, раскомментируй:
    // if (p.is_visible === false) return;

    const cats = (catIdsByProduct.get(p.id) ?? [])
      .map(id => catNameById.get(id))
      .filter(Boolean)
      .join(', ');

    const subs = (subIdsByProduct.get(p.id) ?? [])
      .map(id => subNameById.get(id))
      .filter(Boolean)
      .join(', ');

    rows.push([
      csvEscape(p.id),
      csvEscape(p.title ?? ''),
      csvEscape(p.slug ?? ''),
      csvEscape(cats),
      csvEscape(subs),
      csvEscape(p.composition ?? ''),
      csvEscape(p.short_desc ?? ''),
      csvEscape(p.description ?? ''),
    ]);
  });

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="products_export.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
