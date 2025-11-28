'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink from '@components/SkipLink';
import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';

import { Toaster } from 'react-hot-toast';            // ← кастомный тостер
import type { Category } from '@/types/category';

// динамические компоненты
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

          {/* ------------------------------------------------------------------ */}
          {/*                        КАСТОМНЫЙ ТОСТЕР K2H                       */}
          {/* ------------------------------------------------------------------ */}
          <Toaster position="bottom-center">
            {(t) => (
              <div
                className={`
                  ${t.visible ? 'animate-enter' : 'animate-leave'}
                  max-w-[380px] w-[92%] mx-auto
                  bg-white text-black rounded-2xl shadow-xl border border-gray-200
                  px-3 py-3 flex items-center gap-3
                  fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]
                `}
              >
                {/* миниатюра товара */}
                {t.icon && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {t.icon}
                  </div>
                )}

                {/* текстовая часть */}
                <div className="flex flex-col flex-1">
                  <p className="text-sm font-semibold">
                    Товар добавлен в корзину
                  </p>
                  {t.message && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {String(t.message)}
                    </p>
                  )}
                </div>

                {/* кнопка перехода */}
                <a
                  href="/cart"
                  className="
                    px-3 py-1.5 rounded-xl bg-black text-white text-xs font-semibold 
                    uppercase tracking-tight hover:bg-gray-800 transition
                    flex-shrink-0
                  "
                >
                  В корзину
                </a>
              </div>
            )}
          </Toaster>
          {/* ------------------------------------------------------------------ */}

        </CartProvider>
      </CartAnimationProvider>
    </>
  );
}
