// app/api/yml/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ENV
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ------- utils -------
const stripTags = (html = '') =>
  html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const truncateByWord = (s: string, max = 250) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trim() + '…';
};

const escapeXml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Формируем «короткое» превью до 250 символов
const makeShort = (short_desc?: string | null, description?: string | null) => {
  const base = stripTags(short_desc || '') || stripTags(description || '');
  return truncateByWord(base, 250);
};

// Готовим «длинное» описание для <description> (до 3000, допускается простой HTML).
// Здесь легкая нормализация перевода строк → <br/>
const makeLong = (short_desc?: string | null, description?: string | null) => {
  const raw = (description || short_desc || '').trim();
  const normalized = raw
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n/g, '<br/>')
    .slice(0, 3000);
  // Яндекс допускает CDATA — так безопаснее.
  return `<![CDATA[${normalized}]]>`;
};

// ------- YML builder -------
function buildYml({
  products,
  categoriesMap,
}: {
  products: any[];
  categoriesMap: Map<number, { id: number; name: string }>;
}) {
  const now = new Date().toISOString().slice(0, 19);

  // Выведем только те категории, которые реально встречаются
  const usedCatIds = new Set<number>();
  for (const p of products) if (p.__catId) usedCatIds.add(p.__catId);

  const categoriesXml = [...usedCatIds]
    .map((cid) => {
      const c = categoriesMap.get(cid);
      if (!c) return '';
      return `      <category id="${c.id}">${escapeXml(c.name)}</category>`;
    })
    .join('\n');

  const offersXml = products
    .map((p) => {
      const url = `https://keytoheart.ru/product/${p.slug || p.id}`;
      const shortText = makeShort(p.short_desc, p.description);
      const longText = makeLong(p.short_desc, p.description);

      const pictures =
        Array.isArray(p.images) && p.images.length
          ? p.images
              .slice(0, 10)
              .map((src: string) => `        <picture>${escapeXml(src)}</picture>`)
              .join('\n')
          : '';

      return `
      <offer id="${p.id}" available="${p.in_stock ? 'true' : 'false'}">
        <url>${escapeXml(url)}</url>
        <price>${p.price}</price>
        <currencyId>RUR</currencyId>
        <categoryId>${p.__catId || 1}</categoryId>
${pictures}
        <name>${escapeXml(p.title || `Товар ${p.id}`)}</name>
        <description>${longText}</description>
        <param name="Краткое описание">${escapeXml(shortText)}</param>
      </offer>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${now}">
  <shop>
    <name>KEY TO HEART</name>
    <company>Ключ к Сердцу</company>
    <url>https://keytoheart.ru</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
${categoriesXml || '      <category id="1">Клубника в шоколаде</category>'}
    </categories>
    <offers>${offersXml}
    </offers>
  </shop>
</yml_catalog>
`;
}

// ------- route handler -------
export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1) Категории (в карту)
  const { data: cats, error: catsErr } = await supabase
    .from('categories')
    .select('id,name')
    .order('name', { ascending: true });

  if (catsErr) {
    return NextResponse.json({ error: catsErr.message }, { status: 500 });
  }
  const categoriesMap = new Map<number, { id: number; name: string }>();
  (cats || []).forEach((c) => categoriesMap.set(c.id, c));

  // 2) Товары + первая категория из связки
  const { data: prods, error: prodsErr } = await supabase
    .from('products')
    .select(
      `
      id,
      title,
      price,
      images,
      in_stock,
      slug,
      short_desc,
      description,
      product_categories:product_categories(category_id)
    `
    )
    .eq('is_visible', true)
    .order('id', { ascending: true });

  if (prodsErr) {
    return NextResponse.json({ error: prodsErr.message }, { status: 500 });
  }

  // Проставим __catId = первая категория (если есть)
  const products = (prods || []).map((p: any) => {
    const firstCatId =
      Array.isArray(p.product_categories) && p.product_categories.length
        ? p.product_categories[0].category_id
        : undefined;
    return { ...p, __catId: firstCatId };
  });

  const yml = buildYml({ products, categoriesMap });

  return new NextResponse(yml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="keytoheart_yandex.yml"',
    },
  });
}
