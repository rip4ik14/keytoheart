// ✅ Путь: /app/category/[category]/CategoryPageClient.tsx
"use client";

import CategoryBreadcrumbs from "@components/CategoryBreadcrumbs";
import ProductCard from "@components/ProductCard";

export default function CategoryPageClient({
  products,
  apiName,
  slug,
}: {
  products: any[];
  apiName: string;
  slug: string;
}) {
  return (
    <>
      <CategoryBreadcrumbs />

      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">{apiName}</h1>

        {products.length === 0 ? (
          <p className="text-gray-500">Нет товаров в этой категории.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
