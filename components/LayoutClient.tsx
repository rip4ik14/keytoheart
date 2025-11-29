// ✅ Путь: components/LayoutClient.tsx
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink from '@components/SkipLink';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';

import type { Category } from '@/types/category';

// динамические компоненты
const ClientBreadcrumbs = dynamic(
  () => import('@components/ClientBreadcrumbs'),
  { ssr: false },
);
const CookieBanner = dynamic(() => import('@components/CookieBanner'), {
  ssr: false,
});
const PromoFooterBlock = dynamic(
  () => import('@components/PromoFooterBlock'),
  { ssr: false },
);
const MobileContactFab = dynamic(
  () => import('@components/MobileContactFab'),
  { ssr: false },
);
const Footer = dynamic(() => import('@components/Footer'), {
  ssr: false,
});

export default function LayoutClient({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: Category[];
}) {
  const pathname = usePathname();

  // оставлю, если тебе где-то нужно знать, что мы на странице корзины
  const isCartPage =
    pathname === '/cart' || pathname?.startsWith('/cart/');

  return (
    <>
      <SkipLink />

      <CartAnimationProvider>
        <CartProvider>
          <TopBar />
          <StickyHeader initialCategories={categories} />

          <Suspense fallback={null}>
            <ClientBreadcrumbs />
          </Suspense>

          <main
            id="main-content"
            tabIndex={-1}
            className="pt-12 sm:pt-14 font-sans"
          >
            {children}
          </main>

          <Suspense fallback={null}>
            <PromoFooterBlock />
          </Suspense>

          <Footer categories={categories} />
          <CookieBanner />
          <MobileContactFab />
        </CartProvider>
      </CartAnimationProvider>
    </>
  );
}
