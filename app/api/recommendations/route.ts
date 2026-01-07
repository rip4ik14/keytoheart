import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type RecItem = {
  id: number;
  title: string;
  price: number;
  images: string[] | null;
};

function firstImage(images: any): string {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string') {
    return images[0];
  }
  return '/placeholder.jpg';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const productId = Number(searchParams.get('product_id'));
    const limit = Number(searchParams.get('limit') || 12);

    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product_id' },
        { status: 400 },
      );
    }

    // 1) Забираем category_id товара из join-таблицы product_categories
    const { data: productCats, error: catsErr } = await supabaseAdmin
      .from('product_categories')
      .select('category_id')
      .eq('product_id', productId);

    if (catsErr) {
      return NextResponse.json(
        { success: false, error: catsErr.message },
        { status: 500 },
      );
    }

    const categoryIds = (productCats || [])
      .map((x: any) => Number(x.category_id))
      .filter((x) => !Number.isNaN(x));

    if (categoryIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2) Находим другие product_id из этих категорий
    const { data: relatedProductIds, error: relErr } = await supabaseAdmin
      .from('product_categories')
      .select('product_id')
      .in('category_id', categoryIds)
      .neq('product_id', productId)
      .limit(200); // чтобы не тащить бесконечно

    if (relErr) {
      return NextResponse.json(
        { success: false, error: relErr.message },
        { status: 500 },
      );
    }

    const ids = Array.from(
      new Set((relatedProductIds || []).map((x: any) => Number(x.product_id)).filter(Boolean)),
    );

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 3) Забираем сами товары
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, title, price, images, is_visible, in_stock')
      .in('id', ids)
      .eq('is_visible', true)
      .neq('in_stock', false)
      .limit(limit);

    if (prodErr) {
      return NextResponse.json(
        { success: false, error: prodErr.message },
        { status: 500 },
      );
    }

    const mapped = (products || []).map((p: any) => ({
      id: Number(p.id),
      title: p.title,
      price: Number(p.price),
      image: firstImage(p.images),
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
