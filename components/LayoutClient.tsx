'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import Footer from '@components/Footer';
import CookieBanner from '@components/CookieBanner';
import ClientBreadcrumbs from '@components/ClientBreadcrumbs';
import PromoFooterBlock from '@components/PromoFooterBlock';
import MobileContactFab from '@components/MobileContactFab';
import SkipLink from '@components/SkipLink';
import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import type { Category } from '@/types/category';

const StoreInfoSection = dynamic(() => import('@components/StoreInfoSection'), {
  ssr: false,
});

export default function LayoutClient({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: Category[];
}) {
  return (
    <body className="font-sans">
      <SkipLink />
      <CartAnimationProvider>
        <CartProvider>
          <TopBar />
          <StickyHeader initialCategories={categories} />
          <Suspense fallback={<div>Загрузка…</div>}>
            <ClientBreadcrumbs />
          </Suspense>
          <main id="main-content" tabIndex={-1} className="pt-12 sm:pt-14">
            {children}
          </main>
          <PromoFooterBlock />
          <Footer categories={categories} />
          <CookieBanner />
          <MobileContactFab />
          <StoreInfoSection />
        </CartProvider>
      </CartAnimationProvider>
    </body>
  );
}
