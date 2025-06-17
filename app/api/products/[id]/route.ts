import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await prisma.products.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        price: true,
        original_price: true,
        discount_percent: true,
        production_time: true,
        short_desc: true,
        description: true,
        composition: true,
        bonus: true,
        images: true,
        in_stock: true,
        is_visible: true,
        is_popular: true,
        order_index: true,
        created_at: true,
        image_url: true,
        slug: true,
        product_categories: { select: { category_id: true } },
        product_subcategories: { select: { subcategory_id: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const category_ids = product.product_categories.map(c => c.category_id);
    const subcategory_ids = product.product_subcategories.map(s => s.subcategory_id);

    const { product_categories, product_subcategories, ...rest } = product;

    return NextResponse.json({
      ...rest,
      category_ids,
      subcategory_ids,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch product: ' + error.message }, { status: 500 });
  }
}
