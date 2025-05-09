'use client';

import CategoryPreviewClient from '@components/CategoryPreviewClient';
import { Product } from '@/types/product'; // Импортируем тип Product

export default function CategoryPreviewServer({
  categoryName,
  products,
  seeMoreLink,
}: {
  categoryName: string;
  products: Product[];
  seeMoreLink: string;
}) {
  const transformedProducts = products.map((product) => ({
    ...product,
    images: product.images || [], // Гарантируем, что images всегда массив
  }));

  return <CategoryPreviewClient categoryName={categoryName} products={transformedProducts} seeMoreLink={seeMoreLink} />;
}