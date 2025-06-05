'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@components/ProductCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Product } from '@components/CatalogClient';

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
}

export interface Props {
  products: Product[];
  apiName: string;
  slug: string;
  subcategories: Subcategory[];
}

export default function CategoryPageClient({
  products,
  apiName,
  slug,
  subcategories,
}: Props) {
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') || 'newest';
  const subcategory = searchParams.get('subcategory') || 'all';

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  useEffect(() => {
    let sortedProducts = [...products];

    // Фильтрация по подкатегории
    if (subcategory !== 'all') {
      const subcategoryId = subcategories.find((sub) => sub.slug === subcategory)?.id;
      if (subcategoryId) {
        sortedProducts = sortedProducts.filter(
          (p) => p.subcategory_ids.includes(subcategoryId)
        );
      } else {
        sortedProducts = [];
      }
    }

    // Сортировка
    if (sort === 'price-asc') {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      sortedProducts.sort((a, b) => b.price - a.price);
    } else {
      // По новизне (по умолчанию, по ID descending)
      sortedProducts.sort((a, b) => b.id - a.id);
    }

    process.env.NODE_ENV !== "production" && console.log(`Filtered products for subcategory ${subcategory}:`, sortedProducts);
    setFilteredProducts(sortedProducts);
  }, [sort, subcategory, products, subcategories]);

  useEffect(() => {
    window.gtag?.('event', 'view_category', {
      event_category: 'category',
      event_label: apiName,
    });
    window.ym?.(96644553, 'reachGoal', 'view_category', { category: apiName });
  }, [apiName]);

  return (
    <section className="container mx-auto py-6 px-4" aria-label={`Товары в категории ${apiName}`}>
      <h1 className="text-2xl sm:text-3xl font-sans font-bold mb-4">{apiName}</h1>

      {/* Фильтры подкатегорий */}
      {subcategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/category/${slug}?sort=${sort}&subcategory=all`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              subcategory === 'all'
                ? 'bg-black text-white'
                : 'bg-white text-black border hover:bg-gray-100'
            }`}
          >
            Все
          </Link>
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${slug}?sort=${sort}&subcategory=${sub.slug}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                subcategory === sub.slug
                  ? 'bg-black text-white'
                  : 'bg-white text-black border hover:bg-gray-100'
              }`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Сортировка */}
      <div className="mb-6 flex justify-end">
        <select
          value={sort}
          onChange={(e) => {
            const newSort = e.target.value;
            window.location.href = `/category/${slug}?sort=${newSort}&subcategory=${subcategory}`;
          }}
          className="border rounded-md px-3 py-1 text-sm font-sans text-black focus:outline-none focus:ring-2 focus:ring-black"
          aria-label="Сортировка товаров"
        >
          <option value="newest">По новизне</option>
          <option value="price-asc">Цена по возрастанию</option>
          <option value="price-desc">Цена по убыванию</option>
        </select>
      </div>

      {/* Список товаров */}
      {filteredProducts.length === 0 ? (
        <p className="text-gray-500 font-sans">
          Нет товаров в этой категории или подкатегории.
        </p>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          aria-label="Список товаров"
        >
          {filteredProducts.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}