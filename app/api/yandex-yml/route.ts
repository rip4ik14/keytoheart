import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ENV
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// базовый URL сайта для ссылок во фиде
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://keytoheart.ru';

/* ----------------------------- helpers ----------------------------- */
function escapeXml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(input = ''): string {
  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(input: string, limit: number): string {
  if (input.length <= limit) return input;
  const sliced = input.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trim() + '…';
}

function sanitizeForXmlComment(input: string): string {
  return String(input)
    .replace(/--/g, '–')
    .replace(/-\s*$/g, '–');
}

function formatDateForYml(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ------------------------------ YML -------------------------------- */
type ProductRow = {
  id: number;
  title: string | null;
  price: number | null;
  images: string[] | null;
  in_stock: boolean | null;
  slug: string | null;
  short_desc: string | null;
  description: string | null;
  product_categories: { category_id: number }[] | null;
};

type CategoryRow = { id: number; name: string };

function buildYml(products: ProductRow[], categories: CategoryRow[]) {
  const now = formatDateForYml(new Date());

  const catMap = new Map<number, string>();
  categories.forEach((c) => catMap.set(c.id, c.name));

  const categoriesXml =
    categories.length > 0
      ? categories
          .map(
            (c) =>
              `<category id="${c.id}">${escapeXml(c.name)}</category>`
          )
          .join('\n      ')
      : `<category id="1">Клубника в шоколаде</category>`;

  const offersXml = products
    .map((p) => {
      const title = escapeXml(p.title ?? `Товар #${p.id}`);

      // ВАЖНО: всегда используем id, без slug
      const url = `${BASE_URL}/product/${p.id}`;

      const firstCatId =
        p.product_categories?.[0]?.category_id ??
        (categories.length ? categories[0].id : 1);
      const categoryId = catMap.has(firstCatId) ? firstCatId : 1;

      const firstImage =
        p.images && p.images.length ? p.images[0] : null;
      const pictureXml = firstImage
        ? `<picture>${escapeXml(firstImage)}</picture>`
        : '';

      const price = Math.max(0, Number(p.price ?? 0));
      const available = p.in_stock ? 'true' : 'false';

      // Полное описание (в комментарий)
      const fullTextRaw =
        (p.description && p.description.trim()) ||
        (p.short_desc && p.short_desc.trim()) ||
        '';
      const fullTextClean = stripHtml(fullTextRaw);
      const fullForComment = sanitizeForXmlComment(
        fullTextClean.slice(0, 5000)
      );

      // Короткое описание (в description и param)
      const shortSource =
        p.short_desc?.trim() || fullTextClean || '';
      const shortClean = stripHtml(shortSource);
      const short250 = truncateAtWord(shortClean, 250);
      const shortXml = escapeXml(short250);

      return `
      <offer id="${p.id}" available="${available}">
        <url>${url}</url>
        <price>${price}</price>
        <currencyId>RUR</currencyId>
        <categoryId>${categoryId}</categoryId>
        ${pictureXml}
        <name>${title}</name>
        <description>${shortXml}</description>
        <!-- FULL_DESCRIPTION: ${fullForComment} -->
        <param name="Краткое описание">${shortXml}</param>
      </offer>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${now}">
  <shop>
    <name>KEY TO HEART</name>
    <company>Ключ к Сердцу</company>
    <url>${BASE_URL}</url>
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

/* ------------------------------ route ------------------------------ */
export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, name')
    .order('id', { ascending: true });

  if (catErr) {
    return NextResponse.json(
      { error: catErr.message },
      { status: 500 }
    );
  }

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select(
      'id, title, price, images, in_stock, slug, short_desc, description, product_categories(category_id)'
    )
    .eq('is_visible', true)
    .order('id', { ascending: true });

  if (prodErr) {
    return NextResponse.json(
      { error: prodErr.message },
      { status: 500 }
    );
  }

  const yml = buildYml(
    (products || []) as ProductRow[],
    (categories || []) as CategoryRow[]
  );

  return new NextResponse(yml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
