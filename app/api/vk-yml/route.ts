// ✅ Путь: app/vk.xml/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function escapeXml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
function stripHtml(input = '') {
  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateAtWord(input: string, limit: number) {
  if (input.length <= limit) return input;
  const sliced = input.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trim() + '…';
}
function ymlDate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: categoriesData, error: catErr } = await supabase
    .from('categories')
    .select('id, name')
    .order('id', { ascending: true });

  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  const categories: CategoryRow[] = (categoriesData ?? []) as CategoryRow[];

  const { data: productsData, error: prodErr } = await supabase
    .from('products')
    .select('id, title, price, images, slug, short_desc, description, product_categories(category_id)')
    .eq('is_visible', true)
    .order('id', { ascending: true });

  if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 });

  const products: ProductRow[] = (productsData ?? []) as ProductRow[];

  const now = ymlDate();
  const catMap = new Map<number, string>();
  for (const c of categories) catMap.set(c.id, c.name);

  const categoriesXml =
    categories.length > 0
      ? categories.map((c) => `      <category id="${c.id}">${escapeXml(c.name)}</category>`).join('\n')
      : `      <category id="1">Клубника в шоколаде</category>`;

  const offersXml = products.map((p) => {
    const title = escapeXml(p.title ?? `Товар #${p.id}`);
    const url = `https://keytoheart.ru/product/${p.slug || p.id}`;

    const firstCatId = p.product_categories?.[0]?.category_id ?? (categories.length ? categories[0].id : 1);
    const categoryId = catMap.has(firstCatId) ? firstCatId : 1;

    const img = p.images?.[0] ?? '';
    const picture = img ? `\n        <picture>${escapeXml(img)}</picture>` : '';

    const basePrice = Math.max(0, Number(p.price ?? 0));
    const priceUp10 = Math.round(basePrice * 1.10);

    const src = (p.short_desc?.trim() || p.description?.trim() || '') || '';
    const short = truncateAtWord(stripHtml(src), 300);
    const desc = escapeXml(short);

    return `      <offer id="${p.id}">
        <name>${title}</name>
        <url>${url}</url>
        <price>${priceUp10}</price>
        <currencyId>RUB</currencyId>
        <categoryId>${categoryId}</categoryId>${picture}
        <vendorCode>${p.id}</vendorCode>
        <description>${desc}</description>
      </offer>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${now}">
  <shop>
    <name>КЛЮЧ К СЕРДЦУ</name>
    <url>https://keytoheart.ru</url>
    <currencies>
      <currency id="RUB" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <offers>
${offersXml}
    </offers>
  </shop>
</yml_catalog>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="keytoheart_vk.xml"',
      'Cache-Control': 'no-store',
    },
  });
}
