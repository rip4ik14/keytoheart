// app/api/products-export.csv/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* ---------- CSV helpers ---------- */
function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ').trim()}"`;
}
function toCsv(rows: string[][]): string {
  const BOM = '\uFEFF';
  return BOM + rows.map(r => r.join(',')).join('\r\n') + '\r\n';
}

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'ENV переменные для Supabase не заданы' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Продукты
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select(
        'id,title,slug,composition,short_desc,description,is_visible'
      )
      .order('id', { ascending: true });

    if (prodErr) throw new Error(`products: ${prodErr.message}`);

    // 2) Категории и связи
    const [{ data: pc, error: pcErr }, { data: categories, error: catErr }] = await Promise.all([
      supabase.from('product_categories').select('product_id, category_id'),
      supabase.from('categories').select('id,name')
    ]);
    if (pcErr) throw new Error(`product_categories: ${pcErr.message}`);
    if (catErr) throw new Error(`categories: ${catErr.message}`);

    // 3) Подкатегории - безопасная попытка (могут отсутствовать таблица или права)
    let sc: { product_id: number; subcategory_id: number }[] | null = null;
    let subcategories: { id: number; name: string }[] | null = null;
    try {
      const { data: scData, error: scErr } = await supabase
        .from('subcategory_connections')
        .select('product_id, subcategory_id');
      if (!scErr) sc = scData ?? null;

      const { data: subsData, error: subsErr } = await supabase
        .from('subcategories')
        .select('id,name');
      if (!subsErr) subcategories = subsData ?? null;
    } catch {
      // игнорируем - экспорт просто будет без подкатегорий
    }

    // Мапы
    const catNameById = new Map<number, string>((categories ?? []).map(c => [c.id, c.name]));
    const subNameById = new Map<number, string>((subcategories ?? []).map(s => [s.id, s.name]));

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

    // CSV
    const header = [
      'id',
      'title',
      'slug',
      'categories',
      'subcategories',
      'composition',
      'short_desc',
      'description'
    ];
    const rows: string[][] = [header.map(csvEscape)];

    (products ?? []).forEach(p => {
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
        csvEscape(p.description ?? '')
      ]);
    });

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="products_export.csv"',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e: any) {
    console.error('[products-export.csv] error:', e?.message || e);
    return NextResponse.json(
      { error: 'Неполадки на сервере при сборке CSV: ' + (e?.message ?? 'unknown') },
      { status: 500 }
    );
  }
}
