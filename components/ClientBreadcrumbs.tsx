// components/ClientBreadcrumbs.tsx
'use client';

import Breadcrumbs from './Breadcrumbs';
import { usePathname } from 'next/navigation';
import type { Category } from '@/types/category';
export default function ClientBreadcrumbs({ initialCategories }: { initialCategories: Category[] }) {
  const pathname = usePathname();
  const isProductPage = pathname.startsWith('/product/');

  return !isProductPage ? <Breadcrumbs initialCategories={initialCategories} /> : null;
}