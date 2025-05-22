'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@components/ProductCard';
import ProductCardSkeleton from '@components/ProductCardSkeleton';
import FilterSection from '@components/FilterSection';
import SortDropdown from '@components/SortDropdown';
import type { Database } from '@/lib/supabase/types_new';

// Обновлённый интерфейс Product
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
  category_ids: number[]; // Массив ID категорий
  subcategory_ids: number[]; // Массив ID подкатегорий
  subcategory_names: string[]; // Массив названий подкатегорий
}

// Тип ProductRow для использования при запросах к Supabase
export type ProductRow = Database['public']['Tables']['products']['Row'];

export type SitePage = {
  label: string;
  href: string;
};

export type SubcategoryFromDB = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
};

export type CategoryFromDB = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
};

type Category = {
  label: string;
  slug: string;
};

type Subcategory = {
  label: string;
  slug: string;
  id: number;
};

type CatalogClientProps = {
  initialProducts: Product[];
  initialSitePages: SitePage[];
  initialSubcategoriesDB: SubcategoryFromDB[];
  categoriesDB: CategoryFromDB[];
};

export default function CatalogClient({
  initialProducts,
  initialSitePages,
  initialSubcategoriesDB,
  categoriesDB,
}: CatalogClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [sitePages] = useState<SitePage[]>(initialSitePages);
  const [subcategoriesDB] = useState<SubcategoryFromDB[]>(initialSubcategoriesDB);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // Храним slug категории
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Создаём маппинг slug -> category_id
  const categorySlugToIdMap = new Map<string, number>();
  categoriesDB.forEach(category => {
    categorySlugToIdMap.set(category.slug, category.id);
  });

  // Получаем все категории из sitePages
  const categories: Category[] = Array.from(
    new Map(
      sitePages
        .filter(page => {
          const segments = page.href.split('/').filter(Boolean);
          return page.href.startsWith('/category/') && segments.length === 2;
        })
        .map(page => {
          const slug = page.href.split('/')[2];
          return [slug, { label: page.label, slug }];
        })
    ).values()
  );

  // Получаем подкатегории для выбранной категории
  const subcategories: Subcategory[] = selectedCategory
    ? sitePages
        .filter(page => {
          const segments = page.href.split('/').filter(Boolean);
          return page.href.startsWith(`/category/${selectedCategory}/`) && segments.length === 3;
        })
        .map(page => {
          const slug = page.href.split('/')[3];
          const subcategory = subcategoriesDB.find(sub => sub.slug === slug);
          return {
            label: page.label,
            slug,
            id: subcategory ? subcategory.id : 0,
          };
        })
        .filter(sub => sub.id !== 0)
    : [];

  // Применяем фильтры
  useEffect(() => {
    let filtered = [...products];

    // Фильтр по цене
    filtered = filtered.filter(product => {
      const price = product.discount_percent
        ? Math.round(product.price * (1 - product.discount_percent / 100))
        : product.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Фильтр по категории (по category_ids)
    if (selectedCategory) {
      const selectedCategoryId = categorySlugToIdMap.get(selectedCategory);
      if (selectedCategoryId) {
        filtered = filtered.filter(product => product.category_ids.includes(selectedCategoryId));
      } else {
        filtered = []; // Если category_id не найден, показываем пустой список
      }
    }

    // Фильтр по подкатегории (по subcategory_ids)
    if (selectedSubcategory) {
      filtered = filtered.filter(product => product.subcategory_ids.includes(Number(selectedSubcategory)));
    }

    // Сортировка по цене
    filtered.sort((a, b) => {
      const priceA = a.discount_percent
        ? Math.round(a.price * (1 - a.discount_percent / 100))
        : a.price;
      const priceB = b.discount_percent
        ? Math.round(b.price * (1 - b.discount_percent / 100))
        : b.price;
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });

    setFilteredProducts(filtered);
  }, [products, priceRange, selectedCategory, selectedSubcategory, sortOrder]);

  return (
    <section className="min-h-screen bg-white text-black py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок и сортировка */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black">Каталог товаров</h1>
          <SortDropdown sortOrder={sortOrder} setSortOrder={setSortOrder} />
        </div>

        {/* Основной контент */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Фильтры */}
          <div className="flex-shrink-0">
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
          </div>

          {/* Сетка товаров */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <p className="text-center text-red-500 text-lg">{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 text-lg">Товары не найдены</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}