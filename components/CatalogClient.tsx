'use client';

import { useState, useEffect } from 'react';
import ProductCard           from '@components/ProductCard';
import ProductCardSkeleton   from '@components/ProductCardSkeleton';
import FilterSection         from '@components/FilterSection';
import SortDropdown          from '@components/SortDropdown';
import type { Database }     from '@/lib/supabase/types_new';

/* ------------------------------------------------------------------ */
/*                               TYPES                                */
/* ------------------------------------------------------------------ */

export interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent?: number | null | undefined;
  original_price?: number | null | undefined;
  in_stock?: boolean | null;
  images: string[];
  image_url?: string | null;
  created_at?: string | null;
  slug?: string | null;
  bonus?: number | null;
  short_desc?: string | null;
  description?: string | null;
  composition?: string | null;
  is_popular?: boolean | null;
  is_visible?: boolean | null;
  production_time?: number | null;
  category_ids: number[];
  subcategory_ids: number[];
  subcategory_names: string[];
}

export type ProductRow        = Database['public']['Tables']['products']['Row'];
export type SitePage          = { label: string; href: string };
export type SubcategoryFromDB = { id: number; name: string; slug: string; is_visible: boolean };
export type CategoryFromDB    = { id: number; name: string; slug: string; is_visible: boolean };

type Category    = { label: string; slug: string };
type Subcategory = { label: string; slug: string; id: number };

type CatalogClientProps = {
  initialProducts:         Product[];
  initialSitePages:        SitePage[];
  initialSubcategoriesDB:  SubcategoryFromDB[];
  categoriesDB:            CategoryFromDB[];
};

/* ------------------------------------------------------------------ */
/*                              COMPONENT                             */
/* ------------------------------------------------------------------ */

export default function CatalogClient({
  initialProducts,
  initialSitePages,
  initialSubcategoriesDB,
  categoriesDB,
}: CatalogClientProps) {
  /* ------------------------------ state ----------------------------- */
  const [products]           = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [sitePages]          = useState<SitePage[]>(initialSitePages);
  const [subcategoriesDB]    = useState<SubcategoryFromDB[]>(initialSubcategoriesDB);
  const [loading]            = useState(false);          // реальный loading убран
  const [error]              = useState<string | null>(null);

  /* ---------------------------- filters ----------------------------- */
  const [priceRange, setPriceRange]             = useState<[number, number]>([0, 10_000]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');   // slug
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | ''>('');
  const [sortOrder, setSortOrder]               = useState<'asc' | 'desc'>('asc');

  /* -------- slug → categoryId map (чтобы не искать постоянно) ------- */
  const categorySlugToIdMap = new Map<string, number>();
  categoriesDB.forEach((c) => categorySlugToIdMap.set(c.slug, c.id));

  /* --------------------- derive categories list --------------------- */
  const categories: Category[] = Array.from(
    new Map(
      sitePages
        .filter((p) => {
          const segments = p.href.split('/').filter(Boolean);
          return p.href.startsWith('/category/') && segments.length === 2;
        })
        .map((p) => {
          const slug = p.href.split('/')[2];
          return [slug, { label: p.label, slug }];
        }),
    ).values(),
  );

  /* --------------- derive sub-categories for dropdown --------------- */
  const subcategories: Subcategory[] = selectedCategory
    ? sitePages
        .filter((p) => {
          const segments = p.href.split('/').filter(Boolean);
          return p.href.startsWith(`/category/${selectedCategory}/`) && segments.length === 3;
        })
        .map((p) => {
          const slug = p.href.split('/')[3];
          const match = subcategoriesDB.find((s) => s.slug === slug);
          return { label: p.label, slug, id: match ? match.id : 0 };
        })
        .filter((s) => s.id !== 0)
    : [];

  /* ----------------------------- effect ----------------------------- */
  useEffect(() => {
    let list = [...products];

    /* price filter */
    list = list.filter((p) => {
      const effective = p.discount_percent
        ? Math.round(p.price * (1 - p.discount_percent / 100))
        : p.price;
      return effective >= priceRange[0] && effective <= priceRange[1];
    });

    /* category filter */
    if (selectedCategory) {
      const catId = categorySlugToIdMap.get(selectedCategory);
      list = catId ? list.filter((p) => p.category_ids.includes(catId)) : [];
    }

    /* subcategory filter */
    if (selectedSubcategory) {
      list = list.filter((p) => p.subcategory_ids.includes(Number(selectedSubcategory)));
    }

    /* sort */
    list.sort((a, b) => {
      const pa = a.discount_percent ? Math.round(a.price * (1 - a.discount_percent / 100)) : a.price;
      const pb = b.discount_percent ? Math.round(b.price * (1 - b.discount_percent / 100)) : b.price;
      return sortOrder === 'asc' ? pa - pb : pb - pa;
    });

    setFilteredProducts(list);
  }, [products, priceRange, selectedCategory, selectedSubcategory, sortOrder]);

  /* ----------------------------- render ----------------------------- */
  return (
    <section className="min-h-screen bg-white text-black py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold">Каталог товаров</h1>
          <SortDropdown sortOrder={sortOrder} setSortOrder={setSortOrder} />
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          {/* filters */}
          <FilterSection
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSubcategory={selectedSubcategory}
            setSelectedSubcategory={setSelectedSubcategory}
            categories={categories}
            subcategories={subcategories}
          />

          {/* grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <p className="text-center text-red-500 text-lg">{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 text-lg">Товары не найдены</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((p, idx) => (
                  <ProductCard key={p.id} product={p} priority={idx < 2} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
