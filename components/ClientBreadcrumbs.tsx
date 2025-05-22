'use client';

import Breadcrumbs from '@components/Breadcrumbs';
import { usePathname } from 'next/navigation';

export default function ClientBreadcrumbs({ productTitle }: { productTitle?: string }) {
  const pathname = usePathname();

  // Хлебные крошки отображаются на всех страницах
  return <Breadcrumbs productTitle={productTitle} />;
}