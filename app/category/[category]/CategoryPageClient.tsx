'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { useEffect, useState } from 'react';
import ProductCard from '@components/ProductCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Product } from '@components/CatalogClient';

/* ------------------------ Типы пропсов ------------------------ */
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

/* -------------------------------------------------------------- */
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

  /* ---------- Фильтрация + сортировка ---------- */
  useEffect(() => {
    let sorted = [...products];

    if (subcategory !== 'all') {
      const subId = subcategories.find((s) => s.slug === subcategory)?.id;
      sorted = subId ? sorted.filter((p) => p.subcategory_ids.includes(subId)) : [];
    }

    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => b.id - a.id); // newest

    setFilteredProducts(sorted);
  }, [sort, subcategory, products, subcategories]);

  /* ---------- Web-аналитика ---------- */
  useEffect(() => {
    window.gtag?.('event', 'view_category', { event_category: 'category', event_label: apiName });
    YM_ID && callYm(YM_ID, 'reachGoal', 'view_category', { category: apiName });
  }, [apiName]);

  /* ---------- Минимальная цена для H1 ---------- */
  const minPrice = Math.min(...products.map((p) => p.price));

  return (
    <section className="container mx-auto py-6 px-4" aria-label={`Товары ${apiName}`}>
      {/* --- H1 с ключом «купить» и ценой --- */}
      <h1 className="text-2xl sm:text-3xl font-sans font-bold mb-4">
        Купить {apiName.toLowerCase()} в Краснодаре от {minPrice}₽
      </h1>

      {/* --- Фильтр подкатегорий --- */}
      {subcategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterChip
            href={`/category/${slug}?sort=${sort}&subcategory=all`}
            active={subcategory === 'all'}
            label="Все"
          />
          {subcategories.map((sub) => (
            <FilterChip
              key={sub.id}
              href={`/category/${slug}?sort=${sort}&subcategory=${sub.slug}`}
              active={subcategory === sub.slug}
              label={sub.name}
            />
          ))}
        </div>
      )}

      {/* --- Сортировка --- */}
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
          <option value="price-asc">Цена ↑</option>
          <option value="price-desc">Цена ↓</option>
        </select>
      </div>

      {/* --- Список товаров --- */}
      {filteredProducts.length === 0 ? (
        <p className="text-gray-500 font-sans">Нет товаров в этой категории.</p>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
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

/* ------------ Мелкий подкомпонент для чипа фильтра ------------- */
function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
        active ? 'bg-black text-white' : 'bg-white text-black border hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );
}
