'use client';

import { Suspense } from 'react';
import dynamic      from 'next/dynamic';
import TopBar       from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink     from '@components/SkipLink';
import type { Category } from '@/types/category';

/* --- ленивые провайдеры (JS грузится после hydration) --- */
const CartProvider           = dynamic(() => import('@context/CartContext').then(m => m.CartProvider), { ssr: false });
const CartAnimationProvider  = dynamic(() => import('@context/CartAnimationContext').then(m => m.CartAnimationProvider), { ssr: false });

/* --- ленивые клиентские блоки --- */
const ClientBreadcrumbs = dynamic(() => import('@components/ClientBreadcrumbs'), { ssr: false });
const CookieBanner      = dynamic(() => import('@components/CookieBanner'),      { ssr: false });
const PromoFooterBlock  = dynamic(() => import('@components/PromoFooterBlock'),  { ssr: false });
const MobileContactFab  = dynamic(() => import('@components/MobileContactFab'),  { ssr: false });
const Footer            = dynamic(() => import('@components/Footer'),            { ssr: false });

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
          <Suspense fallback={null}>
            <ClientBreadcrumbs />
          </Suspense>

          <main id="main-content" tabIndex={-1} className="pt-12 sm:pt-14 font-sans">
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
