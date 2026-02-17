'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import SkipLink from '@components/SkipLink';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import { AuthProvider } from '@context/AuthContext';

import type { Category } from '@/types/category';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

const ClientBreadcrumbs = dynamic(() => import('@components/ClientBreadcrumbs'), { ssr: false });
const CookieBanner = dynamic(() => import('@components/CookieBanner'), { ssr: false });
const PromoFooterBlock = dynamic(() => import('@components/PromoFooterBlock'), { ssr: false });

const MobileContactFab = dynamic(() => import('@components/MobileContactFab'), { ssr: false });
const MobileBottomNav = dynamic(() => import('@components/MobileBottomNav'), { ssr: false });

const Footer = dynamic(() => import('@components/Footer'), { ssr: false });

function trackMenu(eventName: string, extra?: Record<string, any>) {
  window.gtag?.('event', eventName, { event_category: 'navigation', ...extra });
  if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', eventName, extra || {});
}

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

  // ✅ Железобетонно определяем страницу товара
  const isProductPage = useMemo(() => {
    if (!pathname) return false;
    return /^\/product(\/|$)/.test(pathname);
  }, [pathname]);

  // ✅ Класс на html, чтобы можно было скрывать UI через CSS, если нужно
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    if (isProductPage) root.classList.add('kth-product-page');
    else root.classList.remove('kth-product-page');

    return () => {
      root.classList.remove('kth-product-page');
    };
  }, [isProductPage]);

  // ✅ Поднимаем FAB над нижней фиксированной панелью товара
  // ВАЖНО: iOS pinch-zoom часто триггерит resize, поэтому НЕ слушаем window.resize.
  // Нам нужна только смена брейкпоинта lg -> используем matchMedia change.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const mql = window.matchMedia('(min-width: 1024px)'); // lg

    const apply = () => {
      const isMobile = !mql.matches;
      root.style.setProperty('--kth-bottom-ui-h', isProductPage && isMobile ? '60px' : '0px');
    };

    apply();

    const onChange = () => apply();

    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
    else mql.addListener(onChange);

    return () => {
      if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);

      root.style.setProperty('--kth-bottom-ui-h', '0px');
    };
  }, [isProductPage]);

  // ✅ Если нижнее меню скрыто на товаре, сбрасываем переменную его высоты,
  // иначе после перехода с другой страницы может остаться лишний отступ снизу.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    if (isProductPage) root.style.setProperty('--kth-bottom-nav-h', '0px');
  }, [isProductPage]);

  // ✅ Mobile drawer menu controlled from LayoutClient
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = useMemo(
    () => [
      { name: 'Каталог', href: '/#catalog' },
      { name: 'О нас', href: '/about' },
      { name: 'Доставка', href: '/dostavka' },
      { name: 'Часто задаваемые вопросы', href: '/faq' },
      { name: 'Оплата', href: '/payment' },
      { name: 'Программа лояльности', href: '/loyalty' },
      { name: 'Корпоративным клиентам', href: '/corporate' },
      { name: 'Новости', href: '/news' },
      { name: 'Статьи', href: '/articles' },
      { name: 'Праздники', href: '/occasions' },
      { name: 'Контакты', href: '/contacts' },
    ],
    [],
  );

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    trackMenu('close_mobile_menu');
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((v) => {
      const next = !v;
      trackMenu(next ? 'open_mobile_menu' : 'close_mobile_menu');
      return next;
    });
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let startX = 0;
    const menu = menuRef.current;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (startX - e.changedTouches[0].clientX > 50) {
        setMenuOpen(false);
        trackMenu('close_mobile_menu_swipe');
      }
    };

    if (menu) {
      menu.addEventListener('touchstart', onTouchStart, { passive: true });
      menu.addEventListener('touchend', onTouchEnd, { passive: true });
    }
    return () => {
      if (menu) {
        menu.removeEventListener('touchstart', onTouchStart);
        menu.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const isMobile = typeof window !== 'undefined' && !window.matchMedia('(min-width: 640px)').matches; // sm
    if (!isMobile) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <SkipLink />

      <AuthProvider initialIsAuthenticated={false} initialPhone={null} initialBonus={null}>
        <CartAnimationProvider>
          <CartProvider>
            {!isGiftPage && <TopBar />}
            {!isGiftPage && <StickyHeader initialCategories={categories} />}

            {!isGiftPage && (
              <div className="hidden sm:block">
                <Suspense fallback={null}>
                  <ClientBreadcrumbs />
                </Suspense>
              </div>
            )}

            <main
              id="main-content"
              tabIndex={-1}
              className={
                isGiftPage
                  ? ''
                  : 'pt-12 sm:pt-14 pb-[calc(var(--kth-bottom-nav-h,0px)+var(--kth-bottom-ui-h,0px))]'
              }
            >
              {children}
            </main>

            {!isGiftPage && (
              <Suspense fallback={null}>
                <PromoFooterBlock />
              </Suspense>
            )}

            {!isGiftPage && <Footer categories={categories} />}
            {!isGiftPage && <CookieBanner />}

            {!isGiftPage && !menuOpen && <MobileContactFab />}

            {!isGiftPage && !isProductPage && (
              <MobileBottomNav isMenuOpen={menuOpen} onToggleMenu={toggleMenu} />
            )}

            {!isGiftPage && (
              <>
                <div
                  ref={menuRef}
                  className={`
                    sm:hidden
                    fixed top-0 left-0 z-[18000] h-full w-72 bg-white shadow-xl
                    transform transition-transform duration-300 ease-in-out
                    ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
                  `}
                  role="dialog"
                  aria-label="Меню навигации"
                  aria-hidden={!menuOpen}
                >
                  <div className="flex items-center justify-between p-4 border-b">
                    <span className="text-sm font-semibold">Меню</span>

                    <button
                      onClick={closeMenu}
                      aria-label="Закрыть меню навигации"
                      className="p-2 rounded-full hover:bg-black/[0.04]"
                      type="button"
                    >
                      <Image src="/icons/times.svg" alt="Close" width={20} height={20} />
                    </button>
                  </div>

                  <nav className="p-4 space-y-1" aria-label="Основная навигация">
                    {navLinks.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.href}
                        onClick={() => {
                          setMenuOpen(false);
                          trackMenu('mobile_menu_link', { link: link.name });
                        }}
                        className="block py-2 text-black hover:bg-gray-100 transition-colors rounded-lg px-2"
                        tabIndex={menuOpen ? 0 : -1}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-auto p-4 flex gap-4 text-xl text-black">
                    <a
                      href="https://vk.com/key_to_heart_store"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="ВКонтакте"
                      aria-label="Перейти в ВКонтакте"
                      onClick={() => trackMenu('mobile_menu_social', { network: 'vk' })}
                    >
                      <Image src="/icons/vk.svg" alt="VK" width={24} height={24} />
                    </a>
                    <a
                      href="https://t.me/keytomyheart"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Telegram"
                      aria-label="Перейти в Telegram"
                      onClick={() => trackMenu('mobile_menu_social', { network: 'telegram' })}
                    >
                      <Image src="/icons/telegram.svg" alt="Telegram" width={24} height={24} />
                    </a>
                    <a
                      href="https://wa.me/79886033821"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp"
                      aria-label="Перейти в WhatsApp"
                      onClick={() => trackMenu('mobile_menu_social', { network: 'whatsapp' })}
                    >
                      <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={24} height={24} />
                    </a>
                  </div>
                </div>

                {menuOpen && (
                  <button
                    type="button"
                    className="sm:hidden fixed inset-0 bg-black/40 z-[17999]"
                    onClick={closeMenu}
                    aria-label="Закрыть меню"
                  />
                )}
              </>
            )}
          </CartProvider>
        </CartAnimationProvider>
      </AuthProvider>
    </>
  );
}
