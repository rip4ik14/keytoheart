import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CatalogClient, { Product, SitePage, CategoryFromDB, SubcategoryFromDB } from '@components/CatalogClient';

// Метаданные для SEO
export const metadata: Metadata = {
  title: 'Каталог товаров | KEY TO HEART',
  description: 'Купите клубничные букеты и цветы с доставкой по Краснодару. Широкий выбор, свежие цветы, лучшие цены.',
  keywords: ['клубничные букеты', 'цветы', 'доставка Краснодар', 'KEY TO HEART'],
  openGraph: {
    title: 'Каталог товаров | KEY TO HEART',
    description: 'Купите клубничные букеты и цветы с доставкой по Краснодару.',
    url: 'https://keytoheart.ru/catalog',
    images: [{ url: '/og-cover.webp', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://keytoheart.ru/catalog' },
};

export default async function CatalogPage() {
  // Загружаем sitePages через Prisma
  const fetchSitePages = async (): Promise<SitePage[]> => {
    try {
      const data = await prisma.site_pages.findMany({
        select: { label: true, href: true },
        orderBy: { order_index: 'asc' },
      });
      return data;
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки sitePages:', err);
      return [];
    }
  };

  // Загружаем категории через Prisma
  const fetchCategories = async (): Promise<CategoryFromDB[]> => {
    try {
      const data = await prisma.categories.findMany({
        select: { id: true, name: true, slug: true, is_visible: true },
      });
      return data;
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки категорий:', err);
      return [];
    }
  };

  // Загружаем подкатегории через Prisma
  const fetchSubcategories = async (): Promise<SubcategoryFromDB[]> => {
    try {
      const data = await prisma.subcategories.findMany({
        select: { id: true, name: true, slug: true, is_visible: true },
      });
      return data;
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки подкатегорий:', err);
      return [];
    }
  };

  // Загружаем все товары через Prisma
  const fetchProducts = async (): Promise<Product[]> => {
    try {
      const data = await prisma.products.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          title: true,
          price: true,
          original_price: true,
          discount_percent: true,
          images: true,
          image_url: true,
          created_at: true,
          slug: true,
          bonus: true,
          short_desc: true,
          description: true,
          composition: true,
          is_popular: true,
          is_visible: true,
          in_stock: true,
          product_categories: { select: { category_id: true } },
          product_subcategories: {
            select: {
              subcategory_id: true,
              subcategories: { select: { name: true } },
            },
          },
        },
      });

      return data.map(product => ({
        id: product.id,
        title: product.title ?? 'Без названия',
        price: product.price ?? 0,
        original_price: product.original_price ? Number(product.original_price) : product.price,
        discount_percent: product.discount_percent ?? 0,
        images: Array.isArray(product.images) ? product.images : [],
        image_url: product.image_url ?? null,
        created_at: product.created_at ? product.created_at.toISOString() : null,
        slug: product.slug ?? null,
        bonus: product.bonus ? Number(product.bonus) : null,
        short_desc: product.short_desc ?? null,
        description: product.description ?? null,
        composition: product.composition ?? null,
        is_popular: product.is_popular ?? null,
        is_visible: product.is_visible ?? null,
        in_stock: product.in_stock ?? null,
        category_ids: product.product_categories.map(c => c.category_id),
        subcategory_ids: product.product_subcategories.map(s => s.subcategory_id),
        subcategory_names: product.product_subcategories
          .map(s => s.subcategories?.name || '')
          .filter(name => name),
      }));
    } catch (err: any) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки товаров:', err);
      return [];
    }
  };

  // Загружаем данные параллельно
  const [products, sitePages, subcategoriesDB, categoriesDB] = await Promise.all([
    fetchProducts(),
    fetchSitePages(),
    fetchSubcategories(),
    fetchCategories(),
  ]);

  return (
    <CatalogClient
      initialProducts={products}
      initialSitePages={sitePages}
      initialSubcategoriesDB={subcategoriesDB}
      categoriesDB={categoriesDB}
    />
  );
}