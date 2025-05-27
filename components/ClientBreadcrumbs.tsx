// components/ClientBreadcrumbs.tsx
'use client';

import Breadcrumbs from './Breadcrumbs';
import { usePathname } from 'next/navigation';

export default function ClientBreadcrumbs() {
  const pathname = usePathname();
  const isProductPage = pathname.startsWith('/product/');

  return !isProductPage ? <Breadcrumbs /> : null;
}