'use client';

import Breadcrumbs from '@components/Breadcrumbs';
import { usePathname } from 'next/navigation';

export default function ClientBreadcrumbs() {
  const pathname = usePathname();
  const isProductPage = pathname.startsWith('/product/');

  return !isProductPage ? <Breadcrumbs /> : null;
}