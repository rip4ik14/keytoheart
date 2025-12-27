'use client';

import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink from '@components/SkipLink';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';

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

  // оставлю, если где-то нужно знать, что мы на странице корзины
  const isCartPage = pathname === '/cart' || pathname?.startsWith('/cart/');

  /**
   * ✅ Авто-детект подарочных страниц.
   * Так как ты перенёс в app/(gift)/..., URL будет /regina2026, но "группу" (gift) в URL не видно.
   * Поэтому детект делаем по конкретным публичным роутам, И/ИЛИ по списку, который легко расширять.
   *
   * Если хочешь вообще без списка — можно завести префикс типа /gift/... (но ты сейчас хочешь красивый /regina2026).
   */
  const isGiftPage = useMemo(() => {
    if (!pathname) return false;

    // ✅ сюда добавляй любые подарочные роуты (сейчас твой /regina2026)
    const GIFT_ROUTES = new Set<string>([
      '/regina2026',
      '/anya2026',
    ]);

    // точное совпадение
    if (GIFT_ROUTES.has(pathname)) return true;

    // на случай вложенных страниц подарка
    for (const r of GIFT_ROUTES) {
      if (pathname.startsWith(r + '/')) return true;
    }

    return false;
  }, [pathname]);

  return (
    <>
      <SkipLink />

      <CartAnimationProvider>
        <CartProvider>
          {/* ✅ Всё магазинное скрываем на подарке */}
          {!isGiftPage && <TopBar />}
          {!isGiftPage && <StickyHeader initialCategories={categories} />}

          {!isGiftPage && (
            <Suspense fallback={null}>
              <ClientBreadcrumbs />
            </Suspense>
          )}

          <main
            id="main-content"
            tabIndex={-1}
            className={isGiftPage ? 'font-sans' : 'pt-12 sm:pt-14 font-sans'}
          >
            {children}
          </main>

          {!isGiftPage && (
            <Suspense fallback={null}>
              <PromoFooterBlock />
            </Suspense>
          )}

          {!isGiftPage && <Footer categories={categories} />}

          {/* баннеры/кнопки тоже лучше спрятать */}
          {!isGiftPage && <CookieBanner />}
          {!isGiftPage && <MobileContactFab />}
        </CartProvider>
      </CartAnimationProvider>
    </>
  );
}
