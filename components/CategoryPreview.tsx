"use client";

import Link from "next/link";
import ProductCard from "@components/ProductCard";

interface Product {
  id: number;
  title: string;
  price: number;
  in_stock?: boolean; // 👈 добавили поле
  images?: string[];
}

interface Props {
  categoryName: string;
  products: Product[];
  seeMoreLink: string; // slug для категории
}

export default function CategoryPreview({
  categoryName,
  products,
  seeMoreLink,
}: Props) {
  // 👇 фильтруем только доступные товары
  const visibleProducts = products.filter((product) => product.in_stock !== false);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
        {categoryName}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="text-center mt-6">
        <Link
          href={`/category/${seeMoreLink}`}
          className="text-[var(--orange)] hover:underline font-medium"
        >
          Показать ещё
        </Link>
      </div>
    </section>
  );
}
