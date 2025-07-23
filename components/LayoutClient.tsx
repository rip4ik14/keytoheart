'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink from '@components/SkipLink'; // <-- ВЕРНИ этот импорт!
import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import type { Category } from '@/types/category';

// дальше — динамические импорты
const ClientBreadcrumbs = dynamic(() => import('@components/ClientBreadcrumbs'), { ssr: false });
const CookieBanner      = dynamic(() => import('@components/CookieBanner'), { ssr: false });
const PromoFooterBlock  = dynamic(() => import('@components/PromoFooterBlock'), { ssr: false });
const MobileContactFab  = dynamic(() => import('@components/MobileContactFab'), { ssr: false });
const Footer            = dynamic(() => import('@components/Footer'), { ssr: false });


export default function LayoutClient({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: Category[];
}) {
  return (
    <>
      {/* Оставляем skip link обычным — он минимален */}
      <SkipLink />
      <CartAnimationProvider>
        <CartProvider>
          <TopBar />
          <StickyHeader initialCategories={categories} />
          {/* Хлебные крошки — динамически, Suspense для fallback */}
          <Suspense fallback={null}>
            <ClientBreadcrumbs />
          </Suspense>
          <main id="main-content" tabIndex={-1} className="pt-12 sm:pt-14 font-sans">
            {children}
          </main>
          {/* PromoFooterBlock, Footer, CookieBanner, MobileContactFab — все ленивые! */}
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
