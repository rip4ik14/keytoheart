import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Берём ENV-переменные
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// YML-шаблон под Яндекс (базовый пример)
function buildYml(products: any[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString().slice(0, 19)}">
  <shop>
    <name>KEY TO HEART</name>
    <company>Ключ к Сердцу</company>
    <url>https://keytoheart.ru</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Клубника в шоколаде</category>
    </categories>
    <offers>
      ${products.map((product, idx) => `
      <offer id="${product.id}" available="${product.in_stock ? 'true' : 'false'}">
        <url>https://keytoheart.ru/product/${product.slug || product.id}</url>
        <price>${product.price}</price>
        <currencyId>RUR</currencyId>
        <categoryId>1</categoryId>
        ${product.images?.[0] ? `<picture>${product.images[0]}</picture>` : ''}
        <name>${escapeXml(product.title)}</name>
        <description>${escapeXml(product.short_desc || product.description || '')}</description>
      </offer>
      `).join('')}
    </offers>
  </shop>
</yml_catalog>
  `;
}

function escapeXml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Загрузи все видимые товары с ценой и фото
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, images, in_stock, slug, short_desc, description')
    .eq('is_visible', true)
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const yml = buildYml(data || []);
  return new NextResponse(yml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="keytoheart_yandex.yml"',
    },
  });
}
