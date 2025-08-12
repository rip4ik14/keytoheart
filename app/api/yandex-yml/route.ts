// app/api/yml/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function escapeXml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

type ProductRow = {
  id: number;
  title: string;
  price: number;
  images: string[] | null;
  in_stock: boolean | null;
  slug: string | null;
  short_desc: string | null;
  description: string | null;
  composition: string | null;
  product_categories?: { category_id: number }[] | null;
};

type CategoryRow = { id: number; name: string };

function buildYml(products: ProductRow[], categoriesMap: Map<number, string>) {
  const date = new Date().toISOString().slice(0, 19);

  // Подготовим XML категорий: используем только задействованные, плюс "прочее" при необходимости
  const usedCatIds = new Set<number>();
  products.forEach((p) => {
    const cid = p.product_categories?.[0]?.category_id;
    if (typeof cid === 'number') usedCatIds.add(cid);
  });

  // Если у каких-то товаров нет категории — добавим спец.категорию 99999
  const needFallback = products.some((p) => !(p.product_categories?.[0]?.category_id));
  const categoriesXml =
    (Array.from(usedCatIds)
      .map((id) => {
        const name = categoriesMap.get(id) ?? `Категория #${id}`;
        return `      <category id="${id}">${escapeXml(name)}</category>`;
      })
      .join('\n')) +
    (needFallback
      ? `\n      <category id="99999">Прочее</category>`
      : '');

  const offersXml = products
    .map((p) => {
      // Описание: полное > краткое; добавляем состав
      const full = (p.description || '').trim();
      const short = (p.short_desc || '').trim();
      const comp = (p.composition || '').trim();

      let desc = full || short || '';
      if (comp) {
        desc += (desc ? '\n\nСостав:\n' : 'Состав:\n') + comp;
      }
      if (desc.length > 2900) desc = desc.slice(0, 2900) + '…';

      const picture =
        p.images?.[0] ? `<picture>${escapeXml(p.images[0])}</picture>` : '';

      const categoryId =
        p.product_categories?.[0]?.category_id ?? 99999; // fallback

      return `
      <offer id="${p.id}" available="${p.in_stock ? 'true' : 'false'}">
        <url>https://keytoheart.ru/product/${escapeXml(p.slug || String(p.id))}</url>
        <price>${p.price}</price>
        <currencyId>RUR</currencyId>
        <categoryId>${categoryId}</categoryId>
        ${picture}
        <name>${escapeXml(p.title)}</name>
        <description>${escapeXml(desc)}</description>
      </offer>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
  <shop>
    <name>KEY TO HEART</name>
    <company>Ключ к Сердцу</company>
    <url>https://keytoheart.ru</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <offers>${offersXml}
    </offers>
  </shop>
</yml_catalog>`;
}

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1) Товары + привязки категорий
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select(
      'id, title, price, images, in_stock, slug, short_desc, description, composition, product_categories(category_id)'
    )
    .eq('is_visible', true)
    .order('id', { ascending: true });

  if (prodErr) {
    return NextResponse.json({ error: prodErr.message }, { status: 500 });
  }

  const list = (products || []) as ProductRow[];

  // 2) Собираем id категорий, чтобы получить их имена
  const catIds = Array.from(
    new Set(
      list
        .map((p) => p.product_categories?.[0]?.category_id)
        .filter((v): v is number => typeof v === 'number')
    )
  );

  let categoriesMap = new Map<number, string>();
  if (catIds.length) {
    const { data: cats, error: catErr } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', catIds);

    if (catErr) {
      return NextResponse.json({ error: catErr.message }, { status: 500 });
    }

    (cats || []).forEach((c: CategoryRow) => {
      categoriesMap.set(c.id, c.name);
    });
  }

  const yml = buildYml(list, categoriesMap);

  return new NextResponse(yml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="keytoheart_yandex.yml"',
    },
  });
}
