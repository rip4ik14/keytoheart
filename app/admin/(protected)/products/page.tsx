import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';
import ProductsClient, { Product, CategoryOption } from './ProductsClient';

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token || !verifyAdminJwt(token)) {
    redirect('/admin/login?error=invalid-session');
  }

  let products: Product[] = [];
  let categories: CategoryOption[] = [];

  try {
    const rows = await prisma.products.findMany({
      orderBy: [{ order_index: 'asc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        price: true,
        original_price: true,
        discount_percent: true,
        images: true,
        in_stock: true,
        is_visible: true,
        is_popular: true,
        order_index: true,
        bonus: true,
        composition: true,
        created_at: true,
        description: true,
        image_url: true,
        short_desc: true,
        slug: true,
        production_time: true,
        product_categories: { select: { category_id: true } },
      },
    });

    products = rows.map(r => ({
      id: r.id,
      title: r.title ?? '',
      price: r.price ?? 0,
      original_price:
        r.original_price !== null && typeof r.original_price === 'object' && 'toNumber' in r.original_price
          ? r.original_price.toNumber()
          : r.original_price !== null
            ? Number(r.original_price)
            : null,
      discount_percent: r.discount_percent ?? null,
      images: Array.isArray(r.images) ? r.images : [],
      in_stock: r.in_stock ?? false,
      is_visible: r.is_visible ?? false,
      is_popular: r.is_popular ?? false,
      order_index: r.order_index ?? 0,
      category_ids: r.product_categories.map(pc => pc.category_id),
      bonus: r.bonus !== null && r.bonus !== undefined ? Number(r.bonus) : null,
      composition: r.composition ?? null,
      created_at: r.created_at ? r.created_at.toISOString() : null,
      description: r.description ?? null,
      image_url: r.image_url ?? null,
      short_desc: r.short_desc ?? null,
      slug: r.slug ?? null,
      production_time: r.production_time ?? null,
    }));
  } catch (error) {
    process.env.NODE_ENV !== 'production' && console.error('Error fetching products:', error);
  }

  try {
    const cats = await prisma.categories.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    categories = cats.map(c => ({ id: c.id, name: c.name, slug: c.slug }));
  } catch (error) {
    process.env.NODE_ENV !== 'production' && console.error('Error fetching categories:', error);
  }

  return <ProductsClient initialProducts={products} categories={categories} />;
}
