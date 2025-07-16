'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink from '@components/SkipLink';
import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import type { Category } from '@/types/category';

// Динамические импорты тяжелых и не-critical компонентов
const Footer = dynamic(() => import('@components/Footer'), { ssr: false });
const PromoFooterBlock = dynamic(() => import('@components/PromoFooterBlock'), { ssr: false });
const CookieBanner = dynamic(() => import('@components/CookieBanner'), { ssr: false });
const MobileContactFab = dynamic(() => import('@components/MobileContactFab'), { ssr: false });
const ClientBreadcrumbs = dynamic(() => import('@components/ClientBreadcrumbs'), { ssr: false });

// LazyOnView - отложенный рендер только при появлении в зоне видимости
import LazyOnView from '@components/LazyOnView';

export default function LayoutClient({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: Category[];
}) {
  return (
    <>
      <SkipLink />
      <CartAnimationProvider>
        <CartProvider>
          <TopBar />
          <StickyHeader initialCategories={categories} />
          <Suspense fallback={<div>Загрузка…</div>}>
            <ClientBreadcrumbs />
          </Suspense>
          <main id="main-content" tabIndex={-1} className="pt-12 sm:pt-14 font-sans">
            {children}
          </main>
          {/* Отложенная загрузка PromoFooterBlock только при появлении */}
          <LazyOnView>
            <PromoFooterBlock />
          </LazyOnView>
          <Footer categories={categories} />
          <CookieBanner />
          <MobileContactFab />
        </CartProvider>
      </CartAnimationProvider>
    </>
  );
}
