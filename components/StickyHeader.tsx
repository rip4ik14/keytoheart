// ✅ Путь: components/StickyHeader.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';

import BurgerMenu from '@components/BurgerMenu';
import CategoryNav from '@components/CategoryNav';
import SearchModal from '@components/SearchModal';
import CookieBanner from '@components/CookieBanner';

import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';

import toast from 'react-hot-toast';
import type { Category } from '@/types/category';
import { useAuth } from '@context/AuthContext';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

type StickyHeaderProps = {
  initialCategories: Category[];
};

const MAX_LINK =
  'https://max.ru/u/f9LHodD0cOI-9oT8wIMLqNgL9blgVvmWzHwla0t-q1TLriNRDUJsOEIedDk';

// CSS var for other UI (toasts, fabs etc.)
const STICKY_HEADER_VAR = '--kth-sticky-header-h';

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

export default function StickyHeader({ initialCategories }: StickyHeaderProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();

  const headerRef = useRef<HTMLElement | null>(null);

  const { items } = useCart() as { items: { price: number; quantity: number; imageUrl: string }[] };
  const { animationState, setAnimationState, setCartIconPosition, cartIconPosition } = useCartAnimation();

  const { isAuthenticated, bonus, clearAuth, refreshAuth } = useAuth();

  const cartSum = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const formattedCartSum = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(cartSum);

  const [openProfile, setOpenProfile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [previousTotalItems, setPreviousTotalItems] = useState(0);

  // burger menu state (нужно для новой версии BurgerMenu)
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const cartIconRef = useRef<HTMLImageElement>(null);

  const cartControls = useAnimation();
  const [isFlying, setIsFlying] = useState(false);

  const [isAndroid, setIsAndroid] = useState(false);

  const showMobileFilter = useMemo(() => {
    return pathname === '/' || pathname === '/catalog' || pathname.startsWith('/category/');
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const a = /Android/i.test(ua);
    setIsAndroid(a);

    if (a) document.documentElement.classList.add('kth-android');
    return () => {
      document.documentElement.classList.remove('kth-android');
    };
  }, []);

  useEffect(() => {
    refreshAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // expose sticky header height as CSS var (без лишних записей)
  const lastHeaderHRef = useRef<number>(0);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (lastHeaderHRef.current === h) return;
      lastHeaderHRef.current = h;
      document.documentElement.style.setProperty(STICKY_HEADER_VAR, `${h}px`);
    };

    apply();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => apply());
      ro.observe(el);
    }

    window.addEventListener('resize', apply);
    const t = window.setTimeout(apply, 200);

    return () => {
      window.removeEventListener('resize', apply);
      if (ro) ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (totalItems > 0 && previousTotalItems === 0) {
      cartControls.start({
        scale: [1, 1.25, 1],
        rotate: [0, 10, -10, 0],
        transition: { duration: 0.5, ease: 'easeInOut', repeat: 1 },
      });
    }
    setPreviousTotalItems(totalItems);
  }, [totalItems, cartControls, previousTotalItems]);

  // ✅ важно: не дергать глобальный state на каждом scroll
  // обновляем позицию иконки корзины только когда реально идет "полет"
  useEffect(() => {
    if (!animationState.isAnimating) {
      const el = cartIconRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setCartIconPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      return;
    }

    let raf = 0;

    const updatePos = () => {
      raf = 0;
      const el = cartIconRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      setCartIconPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(updatePos);
    };

    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });

    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [animationState.isAnimating, setCartIconPosition]);

  useEffect(() => {
    if (animationState.isAnimating) setIsFlying(true);
  }, [animationState.isAnimating]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // закрываем бургер при смене маршрута (чтобы не зависало)
  useEffect(() => {
    setIsBurgerOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to logout');

      await clearAuth();

      setOpenProfile(false);
      toast.success('Вы вышли из аккаунта');

      window.dispatchEvent(new Event('authChange'));
      router.refresh();
    } catch (error) {
      process.env.NODE_ENV !== 'production' && console.error('StickyHeader: Error signing out', error);
      toast.error('Не удалось выйти из аккаунта');
    }
  };

  const flyBall =
    isFlying && animationState.isAnimating ? (
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        initial={{ x: animationState.startX, y: animationState.startY, opacity: 1, scale: 1 }}
        animate={{ x: cartIconPosition.x, y: cartIconPosition.y, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        onAnimationComplete={() => {
          setIsFlying(false);
          setAnimationState({ ...animationState, isAnimating: false });
        }}
      >
        <Image
          src={animationState.imageUrl}
          alt="Товар"
          width={40}
          height={40}
          className="w-10 h-10 object-cover rounded-full border border-gray-300"
        />
      </motion.div>
    ) : null;

  const overlayClass = isAndroid ? 'absolute inset-0 bg-black/70' : 'absolute inset-0 bg-black/70 backdrop-blur-sm';

  const trackContact = (kind: 'whatsapp' | 'telegram' | 'max') => {
    const eventName =
      kind === 'whatsapp' ? 'contact_whatsapp' : kind === 'telegram' ? 'contact_telegram' : 'contact_max';

    window.gtag?.('event', eventName, {
      event_category: 'header',
      event_label: `StickyHeader: ${kind}`,
      value: 1,
    });

    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', eventName, { source: 'sticky_header' });
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        data-sticky-header="true"
        className="sticky top-0 z-50 bg-transparent sm:bg-white sm:border-b border-black/10 shadow-none sm:shadow-sm"
        aria-label="Основная навигация"
        itemScope
        itemType="https://schema.org/SiteNavigationElement"
      >
        {/* ========================= */}
        {/* ✅ MOBILE (оставляем как есть) */}
        {/* ========================= */}
        <div className="sm:hidden px-3 pt-2 pb-2 bg-transparent">
          <div
            className={cls(
              'mx-auto',
              'w-full',
              'max-w-[520px]',
              'rounded-[28px]',
              'border border-black/10',
              'shadow-[0_18px_55px_rgba(0,0,0,0.12)]',
              'overflow-hidden',
              'kth-glass kth-sticky-surface',
            )}
          >
            {/* top pill row (logo + actions) */}
            <div className="transition-all duration-200">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="w-10 h-10" aria-hidden="true" />

                <Link
                  href="/"
                  className="text-[15px] font-extrabold tracking-[0.10em] uppercase text-zinc-900"
                  aria-label="Главная"
                >
                  ключ к сердцу
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="w-10 h-10 rounded-full bg-black/5 active:bg-black/10 flex items-center justify-center"
                  aria-label="Поиск"
                >
                  <Image src="/icons/search.svg" alt="" width={20} height={20} className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* categories pill */}
            <div className="px-2 pb-2">
              <div
                className={cls(
                  'relative rounded-[22px]',
                  'border border-black/10',
                  'shadow-[0_10px_26px_rgba(0,0,0,0.06)]',
                  'overflow-hidden',
                  'kth-glass kth-sticky-surface',
                )}
              >
                <div className="pointer-events-none absolute inset-0 opacity-70 kth-glass-highlight" aria-hidden="true" />
                <div className="relative">
                  <CategoryNav initialCategories={initialCategories} showMobileFilter={showMobileFilter} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== */}
        {/* ✅ DESKTOP (вернули как в старом коде) */}
        {/* ===================== */}
        <div className="hidden sm:block">
          <div className={['border-b border-black/0', 'transition-all duration-200', 'opacity-100'].join(' ')}>
            <div className="container mx-auto flex items-center justify-between px-4 py-2 md:py-3 gap-2 min-w-[320px] relative">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                {/* ✅ burger button + drawer (как в новой реализации, но отображаем на десктопе как раньше) */}
                <BurgerMenu open={isBurgerOpen} onOpenChange={setIsBurgerOpen} />

                <Link
                  href="/"
                  className={[
                    'uppercase',
                    'text-[18px] sm:text-[20px] md:text-[30px]',
                    'leading-none',
                    'font-extrabold',
                    'tracking-[0.08em]',
                    'text-zinc-900',
                    'md:absolute md:left-1/2 md:-translate-x-1/2',
                    'truncate',
                  ].join(' ')}
                  aria-label="Перейти на главную страницу"
                >
                  КЛЮЧ К СЕРДЦУ
                </Link>

                <div className="hidden md:flex flex-wrap items-center gap-4 text-sm text-black">
                  <span>Краснодар</span>

                  <div className="flex flex-col leading-tight">
                    <a
                      href="tel:+79886033821"
                      className="font-medium hover:underline"
                      aria-label="Позвонить по номеру +7 (988) 603-38-21"
                    >
                      +7 (988) 603-38-21
                    </a>
                    <span className="text-xs text-gray-600">с 09:00 до 21:00</span>
                  </div>

                  {/* ✅ вернули иконки мессенджеров (desktop only) */}
                  <div className="flex items-center gap-2">
                    <a
                      href="https://wa.me/79886033821"
                      className="border rounded-full p-2 hover:bg-gray-100"
                      title="WhatsApp"
                      aria-label="Перейти в WhatsApp"
                      rel="nofollow"
                      target="_blank"
                      onClick={() => trackContact('whatsapp')}
                    >
                      <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={16} height={16} />
                    </a>

                    <a
                      href="https://t.me/keytomyheart"
                      className="border rounded-full p-2 hover:bg-gray-100"
                      title="Telegram"
                      aria-label="Перейти в Telegram"
                      rel="nofollow"
                      target="_blank"
                      onClick={() => trackContact('telegram')}
                    >
                      <Image src="/icons/telegram.svg" alt="Telegram" width={16} height={16} />
                    </a>

                    <a
                      href={MAX_LINK}
                      className="border rounded-full p-2 hover:bg-gray-100"
                      title="MAX"
                      aria-label="Перейти в MAX"
                      rel="nofollow"
                      target="_blank"
                      onClick={() => trackContact('max')}
                    >
                      <Image src="/icons/max.svg" alt="MAX" width={16} height={16} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 relative">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black md:p-2.5"
                  title="Поиск"
                  aria-controls="search-modal"
                >
                  <Image src="/icons/search.svg" alt="Поиск" width={20} height={20} className="w-5 h-5" />
                </button>

                <div className="hidden sm:flex items-center gap-2 md:gap-3">
                  {isAuthenticated ? (
                    <div ref={profileRef} className="relative">
                      <button
                        onClick={() => setOpenProfile((p) => !p)}
                        className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black md:px-4 md:py-1 md:border md:rounded-full"
                        aria-expanded={openProfile}
                      >
                        <div className="hidden md:flex items-center gap-2">
                          {bonus !== null && bonus >= 0 && (
                            <span className="rounded-full border px-2 py-[2px] text-xs font-semibold">
                              Бонусов: {bonus}
                            </span>
                          )}
                          <span>Профиль</span>
                        </div>

                        <Image src="/icons/user.svg" alt="Профиль" width={20} height={20} className="w-5 h-5 md:hidden" />
                      </button>

                      <AnimatePresence>
                        {openProfile && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-48 bg-white shadow-lg border rounded-lg z-50"
                          >
                            <div className="py-1">
                              <Link
                                href="/account"
                                className="block px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
                                onClick={() => setOpenProfile(false)}
                              >
                                Личный кабинет
                              </Link>

                              <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
                              >
                                Выход
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href="/account"
                      className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black md:px-4 md:py-1 md:border md:rounded-full"
                      aria-label="Войти в аккаунт"
                    >
                      <Image src="/icons/user.svg" alt="Вход" width={20} height={20} className="w-5 h-5 md:hidden" />
                      <span className="hidden md:inline">Вход</span>
                    </Link>
                  )}

                  <Link
                    href="/cart"
                    className="relative flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black md:gap-2 md:border md:px-3 md:py-1 md:rounded-full"
                    title="Корзина"
                    aria-label="Перейти в корзину"
                  >
                    <motion.div animate={cartControls} className="relative">
                      <Image
                        ref={cartIconRef}
                        src="/icons/shopping-cart.svg"
                        alt="Корзина"
                        width={20}
                        height={20}
                        className={`w-5 h-5 ${totalItems > 0 ? 'text-rose-500' : 'text-gray-900'}`}
                        loading="eager"
                      />

                      {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-white">
                          {totalItems}
                        </span>
                      )}
                    </motion.div>

                    {cartSum > 0 && <span className="hidden sm:block text-base font-medium">{formattedCartSum}</span>}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {flyBall}

          <div className="border-t">
            <CategoryNav initialCategories={initialCategories} showMobileFilter={showMobileFilter} />
          </div>
        </div>
      </header>

      {/* Search modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            id="search-modal"
            className="fixed inset-0 z-[9999] flex items-start justify-center kth-sticky-surface"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div className={overlayClass} onClick={() => setIsSearchOpen(false)} aria-hidden="true" />

            <div className="relative w-full max-w-md sm:max-w-2xl mx-4 mt-16 sm:mt-24">
              <motion.div
                className="bg-white rounded-2xl z-10"
                initial={isAndroid ? { opacity: 0, y: 12 } : { scale: 0.96, opacity: 0 }}
                animate={isAndroid ? { opacity: 1, y: 0 } : { scale: 1, opacity: 1 }}
                exit={isAndroid ? { opacity: 0, y: 12 } : { scale: 0.96, opacity: 0 }}
                transition={
                  isAndroid ? { duration: 0.18 } : { type: 'spring', stiffness: 220, damping: 26, delay: 0.06 }
                }
              >
                <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
              </motion.div>

              <motion.button
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-black focus:ring-2 focus:ring-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, delay: 0.06 }}
                aria-label="Закрыть поиск"
              >
                <Image src="/icons/x.svg" alt="Закрыть" width={24} height={24} loading="eager" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CookieBanner />
    </>
  );
}
