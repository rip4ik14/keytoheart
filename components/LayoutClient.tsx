// ✅ Путь: components/LayoutClient.tsx
'use client';

import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink from '@components/SkipLink';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import { AuthProvider } from '@context/AuthContext';

import type { Category } from '@/types/category';

const ClientBreadcrumbs = dynamic(() => import('@components/ClientBreadcrumbs'), { ssr: false });
const CookieBanner = dynamic(() => import('@components/CookieBanner'), { ssr: false });
const PromoFooterBlock = dynamic(() => import('@components/PromoFooterBlock'), { ssr: false });
const MobileContactFab = dynamic(() => import('@components/MobileContactFab'), { ssr: false });
const Footer = dynamic(() => import('@components/Footer'), { ssr: false });

export default function LayoutClient({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: Category[];
}) {
  const pathname = usePathname();

  const isCartPage = pathname === '/cart' || pathname?.startsWith('/cart/');

  const isGiftPage = useMemo(() => {
    if (!pathname) return false;

    const GIFT_ROUTES = new Set<string>(['/regina2026', '/anya2026']);

    if (GIFT_ROUTES.has(pathname)) return true;

    for (const r of GIFT_ROUTES) {
      if (pathname.startsWith(r + '/')) return true;
    }

    return false;
  }, [pathname]);

  return (
    <>
      <SkipLink />

      <AuthProvider initialIsAuthenticated={false} initialPhone={null} initialBonus={null}>
        <CartAnimationProvider>
          <CartProvider>
            {!isGiftPage && <TopBar />}
            {!isGiftPage && <StickyHeader initialCategories={categories} />}

            {!isGiftPage && (
              <Suspense fallback={null}>
                <ClientBreadcrumbs />
              </Suspense>
            )}

            {/* ✅ Убрали font-sans отсюда. Шрифт теперь задаётся на body в app/layout.tsx */}
            <main id="main-content" tabIndex={-1} className={isGiftPage ? '' : 'pt-12 sm:pt-14'}>
              {children}
            </main>

            {!isGiftPage && (
              <Suspense fallback={null}>
                <PromoFooterBlock />
              </Suspense>
            )}

            {!isGiftPage && <Footer categories={categories} />}

            {!isGiftPage && <CookieBanner />}
            {!isGiftPage && <MobileContactFab />}
          </CartProvider>
        </CartAnimationProvider>
      </AuthProvider>
    </>
  );
}
