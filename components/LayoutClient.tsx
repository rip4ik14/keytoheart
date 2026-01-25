'use client';

import { Suspense, useMemo, useEffect } from 'react';
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

// ✅ FAB (и мобилка, и десктоп)
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

  const isGiftPage = useMemo(() => {
    if (!pathname) return false;

    const GIFT_ROUTES = new Set<string>(['/regina2026', '/anya2026']);
    if (GIFT_ROUTES.has(pathname)) return true;

    for (const r of GIFT_ROUTES) {
      if (pathname.startsWith(r + '/')) return true;
    }

    return false;
  }, [pathname]);

  // ✅ Поднимаем FAB над нижней фиксированной панелью товара (чтобы не перекрывал "Комбо -10%")
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    const apply = () => {
      const isProductPage = !!pathname && pathname.startsWith('/product/');
      const isMobile = !window.matchMedia('(min-width: 1024px)').matches; // lg

      // Важно: нижняя панель товара перекрывалась FAB по правому краю
      // Поэтому даём запас побольше, чтобы FAB гарантированно жил выше кнопок
      root.style.setProperty('--kth-bottom-ui-h', isProductPage && isMobile ? '60px' : '0px');
    };

    apply();
    window.addEventListener('resize', apply);

    return () => {
      window.removeEventListener('resize', apply);
      root.style.setProperty('--kth-bottom-ui-h', '0px');
    };
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
