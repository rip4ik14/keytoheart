'use client';

import CategoryPreviewClient from '@components/CategoryPreviewClient';
import { Product } from '@/types/product'; // Импортируем тип Product

// Wrapper component for CategoryPreviewClient
export default function CategoryPreviewWrapper({
  categoryName,
  products,
  seeMoreLink,
  headingId,
}: {
  categoryName: string;
  products: Product[];
  seeMoreLink: string;
  headingId: string;
}) {
  const transformedProducts = products.map((product) => ({
    ...product,
    images: product.images || [], // Гарантируем, что images всегда массив
  }));

  return (
    <CategoryPreviewClient
      categoryName={categoryName}
      products={transformedProducts}
      seeMoreLink={seeMoreLink}
      headingId={headingId}
    />
  );
}