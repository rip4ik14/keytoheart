// ✅ Путь: app/vk.xml/route.ts
import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';

export const revalidate = 0; // всегда свежий фид

function xmlEscape(value: any) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';

  // 1) категории (для categoryId)
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true });

  if (catError) {
    return NextResponse.json(
      { success: false, message: catError.message || 'Ошибка загрузки категорий' },
      { status: 500 },
    );
  }

  // 2) связи товар-категория
  const { data: pc, error: pcError } = await supabase
    .from('product_categories')
    .select('product_id, category_id');

  if (pcError) {
    return NextResponse.json(
      { success: false, message: pcError.message || 'Ошибка загрузки product_categories' },
      { status: 500 },
    );
  }

  const catByProduct = new Map<number, number[]>();
  (pc || []).forEach((row) => {
    const existing = catByProduct.get(row.product_id) || [];
    catByProduct.set(row.product_id, [...existing, row.category_id]);
  });

  const productIds = Array.from(catByProduct.keys());
  if (productIds.length === 0) {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString()}">
  <shop>
    <name>${xmlEscape('KeyToHeart')}</name>
    <company>${xmlEscape('KeyToHeart')}</company>
    <url>${xmlEscape(siteUrl)}</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
      ${(categories || [])
        .map((c) => `<category id="${c.id}">${xmlEscape(c.name)}</category>`)
        .join('\n      ')}
    </categories>
    <offers>
    </offers>
  </shop>
</yml_catalog>`;

    return new NextResponse(emptyXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'attachment; filename="keytoheart_vk.xml"',
      },
    });
  }

  // 3) товары
  const { data: products, error: pError } = await supabase
    .from('products')
    .select(
      `
      id,
      title,
      price,
      discount_percent,
      original_price,
      images,
      image_url,
      description,
      short_desc,
      slug,
      in_stock,
      is_visible
    `,
    )
    .in('id', productIds)
    .eq('is_visible', true)
    .order('order_index', { ascending: true })
    .order('id', { ascending: false });

  if (pError) {
    return NextResponse.json(
      { success: false, message: pError.message || 'Ошибка загрузки товаров' },
      { status: 500 },
    );
  }

  const nowIso = new Date().toISOString();

  const categoriesXml = (categories || [])
    .map((c) => `<category id="${c.id}">${xmlEscape(c.name)}</category>`)
    .join('\n      ');

  const offersXml = (products || [])
    .filter((p) => !!p?.id && !!p?.title && typeof p?.price === 'number')
    .map((p) => {
      // ✅ ВАЖНО: цена БЕЗ +10%
      const price = Number(p.price);

      const productUrl = p.slug
        ? `${siteUrl}/product/${encodeURIComponent(p.slug)}`
        : `${siteUrl}/product/${encodeURIComponent(String(p.id))}`;

      const pics: string[] = Array.isArray(p.images) ? p.images : [];
      const fallbackPic = p.image_url ? [p.image_url] : [];
      const allPics = [...pics, ...fallbackPic].filter(Boolean);

      const categoryIds = catByProduct.get(p.id) || [];
      const primaryCategoryId = categoryIds[0];

      const descRaw = p.description || p.short_desc || '';
      const description = xmlEscape(stripHtml(descRaw));

      const picturesXml = allPics
        .slice(0, 10)
        .map((u) => `<picture>${xmlEscape(u)}</picture>`)
        .join('\n        ');

      // VK/маркетплейсы обычно нормально едят yml_catalog-совместимый оффер
      return `<offer id="${p.id}" available="${p.in_stock ? 'true' : 'false'}">
        <url>${xmlEscape(productUrl)}</url>
        <price>${price}</price>
        <currencyId>RUR</currencyId>
        ${primaryCategoryId ? `<categoryId>${primaryCategoryId}</categoryId>` : ''}
        <name>${xmlEscape(p.title)}</name>
        ${picturesXml ? `\n        ${picturesXml}` : ''}
        ${description ? `\n        <description>${description}</description>` : ''}
      </offer>`;
    })
    .join('\n      ');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${nowIso}">
  <shop>
    <name>${xmlEscape('KeyToHeart')}</name>
    <company>${xmlEscape('KeyToHeart')}</company>
    <url>${xmlEscape(siteUrl)}</url>
    <currencies>
      <currency id="RUR" rate="1"/>
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
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Disposition': 'attachment; filename="keytoheart_vk.xml"',
    },
  });
}