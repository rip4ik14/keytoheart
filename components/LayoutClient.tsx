// ✅ Путь: components/LayoutClient.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink from '@components/SkipLink';
import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';

import { Toaster, resolveValue, type Toast } from 'react-hot-toast';
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
  const pathname = usePathname();

  // не показываем тостер на странице корзины
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

          {/* =============================================================== */}
          {/*          КАСТОМНЫЙ ТОСТЕР "Добавлено в корзину"                */}
          {/*      Работает везде, КРОМЕ страницы корзины (/cart)            */}
          {/* =============================================================== */}
          {!isCartPage && (
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 3500,
              }}
            >
              {(t: Toast) => <ToastBarWithProgress t={t} />}
            </Toaster>
          )}
        </CartProvider>
      </CartAnimationProvider>
    </>
  );
}

/* ======================================================================= */
/*                       КАСТОМНЫЙ ТОСТ С ПРОГРЕСС-БАРОМ                   */
/* ======================================================================= */

function ToastBarWithProgress({ t }: { t: Toast }) {
  const [hover, setHover] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (hover) return; // при наведении замораживаем прогресс-бар

    const duration = t.duration ?? 3500;
    let start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const percent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(percent);

      // важный момент: используем t.dismissed (а не t.dismiss)
      if (percent > 0 && !t.dismissed) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hover, t.duration, t.dismissed]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`
        ${t.visible ? 'animate-enter' : 'animate-leave'}
        max-w-[380px] w-[92%] mx-auto
        bg-white text-black rounded-2xl shadow-xl border border-gray-200
        px-3 py-3 flex items-center gap-3
        fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]
        relative overflow-hidden
      `}
    >
      {/* progress bar */}
      <div
        className="absolute top-0 left-0 h-[3px] bg-black/60 transition-all"
        style={{ width: `${progress}%` }}
      />

      {/* миниатюра товара */}
      {t.icon && (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {t.icon}
        </div>
      )}

      {/* текстовая часть */}
      <div className="flex flex-col flex-1">
        <p className="text-sm font-semibold">Товар добавлен в корзину</p>
        {t.message && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {String(resolveValue(t.message, t))}
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
  );
}

/* напоминание про анимации в globals.css см. в комментариях внизу файла */
