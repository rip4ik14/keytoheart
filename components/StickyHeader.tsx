'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

import BurgerMenu from '@components/BurgerMenu';
import CategoryNav from '@components/CategoryNav';

import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { useAuth } from '@context/AuthContext';

import type { Category } from '@/types/category';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

type StickyHeaderProps = {
  initialCategories: Category[];
};

const MAX_LINK =
  'https://max.ru/u/f9LHodD0cOI-9oT8wIMLqNgL9blgVvmWzHwla0t-q1TLriNRDUJsOEIedDk';

const STICKY_HEADER_VAR = '--kth-sticky-header-h';

const SearchModal = dynamic(() => import('@components/SearchModal'), { ssr: false });

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

export default function StickyHeader({ initialCategories }: StickyHeaderProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();

  const headerRef = useRef<HTMLElement | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const cartIconRef = useRef<HTMLImageElement>(null);

  const { items } = useCart() as {
    items: { price: number; quantity: number; imageUrl: string }[];
  };

  const { animationState, setAnimationState, setCartIconPosition, cartIconPosition } =
    useCartAnimation();

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
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  const [previousTotalItems, setPreviousTotalItems] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // Главное состояние для мобилки на главной:
  // false = первый экран, только search button поверх промо
  // true = скроллнули вниз, показываем sticky header с логотипом и категориями
  const [homeStickyVisible, setHomeStickyVisible] = useState(pathname !== '/');
  const homeStickyVisibleRef = useRef(pathname !== '/');

  const cartControls = useAnimation();

  const showMobileFilter = useMemo(() => {
    return pathname === '/' || pathname === '/catalog' || pathname.startsWith('/category/');
  }, [pathname]);

  const isHomePage = pathname === '/';
  const showHomeCompactSearchOnly = isHomePage && !homeStickyVisible;
  const showHomeMobileStickyHeader = isHomePage && homeStickyVisible;
  const showInnerPageMobileHeader = !isHomePage;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const android = /Android/i.test(ua);
    setIsAndroid(android);

    if (android) document.documentElement.classList.add('kth-android');
    return () => {
      document.documentElement.classList.remove('kth-android');
    };
  }, []);

  useEffect(() => {
    refreshAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // На главной в mobile/tablet sticky header показываем только при скролле вверх.
  // При скролле вниз он прячется, чтобы экономить место, как в нативных приложениях.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (pathname !== '/' || isDesktop) {
      homeStickyVisibleRef.current = pathname !== '/';
      setHomeStickyVisible(pathname !== '/');
      return;
    }

    let raf = 0;
    let lastY = Math.max(window.scrollY || 0, 0);
    const TOP_HIDE_AT = 12;
    const DELTA = 3;

    const update = () => {
      raf = 0;

      const y = Math.max(window.scrollY || 0, 0);
      const dy = y - lastY;
      const current = homeStickyVisibleRef.current;
      let next = current;

      if (y <= TOP_HIDE_AT) {
        next = false;
      } else if (dy > DELTA) {
        next = false;
      } else if (dy < -DELTA) {
        next = true;
      }

      lastY = y;

      if (next !== current) {
        homeStickyVisibleRef.current = next;
        setHomeStickyVisible(next);
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // CSS var для прочих элементов интерфейса
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 1023px)').matches;

    if (isMobile) {
      const mobileHeight = showHomeMobileStickyHeader ? 124 : 0;
      document.documentElement.style.setProperty(STICKY_HEADER_VAR, `${mobileHeight}px`);
      return;
    }

    const el = headerRef.current;
    if (!el) return;

    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (!h) return;
      document.documentElement.style.setProperty(STICKY_HEADER_VAR, `${h}px`);
    };

    apply();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => apply());
      ro.observe(el);
    }

    const r1 = window.requestAnimationFrame(apply);
    const t = window.setTimeout(apply, 250);

    return () => {
      if (ro) ro.disconnect();
      window.cancelAnimationFrame(r1);
      window.clearTimeout(t);
    };
  }, [showHomeMobileStickyHeader]);

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

  useEffect(() => {
    if (!animationState.isAnimating) {
      const el = cartIconRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      setCartIconPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      return;
    }

    let raf = 0;

    const updatePos = () => {
      raf = 0;
      const el = cartIconRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      setCartIconPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(updatePos);
    };

    schedule();

    window.addEventListener('scroll', schedule, { passive: true });

    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => schedule();

    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
    else mql.addListener(onChange);

    window.addEventListener('orientationchange', schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('orientationchange', schedule);

      if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);

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
      process.env.NODE_ENV !== 'production' &&
        console.error('StickyHeader: Error signing out', error);
      toast.error('Не удалось выйти из аккаунта');
    }
  };

  const flyBall =
    isFlying && animationState.isAnimating ? (
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        initial={{
          x: animationState.startX,
          y: animationState.startY,
          opacity: 1,
          scale: 1,
        }}
        animate={{
          x: cartIconPosition.x,
          y: cartIconPosition.y,
          opacity: 0,
          scale: 0.5,
        }}
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
          className="h-10 w-10 rounded-full border border-gray-300 object-cover"
        />
      </motion.div>
    ) : null;

  const overlayClass = isAndroid
    ? 'absolute inset-0 bg-black/70'
    : 'absolute inset-0 bg-black/70 backdrop-blur-sm';

  const trackContact = (kind: 'whatsapp' | 'telegram' | 'max') => {
    const eventName =
      kind === 'whatsapp'
        ? 'contact_whatsapp'
        : kind === 'telegram'
          ? 'contact_telegram'
          : 'contact_max';

    window.gtag?.('event', eventName, {
      event_category: 'header',
      event_label: `StickyHeader: ${kind}`,
      value: 1,
    });

    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', eventName, { source: 'sticky_header' });
    }
  };

  const mobileHeaderCard = (wrapperClassName?: string) => (
    <div className={cls('mx-auto w-full max-w-[860px] px-3 sm:px-4 md:px-5', wrapperClassName)}>
      <div
        className={cls(
          'pointer-events-auto',
          'rounded-[28px]',
          'border border-black/10',
          'shadow-[0_18px_55px_rgba(0,0,0,0.12)]',
          'overflow-hidden',
          'kth-glass kth-sticky-surface',
        )}
      >
        <div className="transition-all duration-200">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="h-10 w-10" aria-hidden="true" />

            <Link
              href="/"
              className="text-[15px] font-extrabold uppercase tracking-[0.10em] text-zinc-900 sm:text-[16px] md:text-[17px]"
              aria-label="Главная"
            >
              ключ к сердцу
            </Link>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 active:bg-black/10 sm:h-11 sm:w-11"
              aria-label="Поиск"
            >
              <Image
                src="/icons/search.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </button>
          </div>
        </div>

        <div className="px-2 pb-2">
  <CategoryNav
    initialCategories={initialCategories}
    showMobileFilter={showMobileFilter}
  />
</div>
      </div>
    </div>
  );

  return (
    <>
      <header
        ref={headerRef}
        data-sticky-header="true"
        className="z-50 bg-transparent lg:sticky lg:top-0 lg:border-b lg:border-black/10 lg:bg-white lg:shadow-sm"
        aria-label="Основная навигация"
        itemScope
        itemType="https://schema.org/SiteNavigationElement"
      >
        {/* MOBILE */}
        <div className="lg:hidden">
          {/* Первый экран главной - только кнопка поиска поверх промо */}
          {showHomeCompactSearchOnly && (
            <div
              className="pointer-events-none fixed inset-x-0 z-[60]"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
            >
              <div className="mx-auto flex w-full max-w-[520px] justify-end px-4">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/85 shadow-[0_12px_28px_rgba(0,0,0,0.10)] backdrop-blur"
                  aria-label="Поиск"
                >
                  <Image
                    src="/icons/search.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Главная после скролла - фиксированный sticky header */}
        <AnimatePresence>
  {showHomeMobileStickyHeader && (
    <motion.div
      className="pointer-events-none fixed inset-x-0 z-[60]"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      initial={{ opacity: 0, y: -14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {mobileHeaderCard()}
    </motion.div>
  )}
</AnimatePresence>

          {/* Внутренние страницы - шапка в потоке документа, чтобы естественно уходила вверх при скролле */}
          {showInnerPageMobileHeader && mobileHeaderCard('pt-2')}
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:block">
          <div
            className={[
              'border-b border-black/0',
              'transition-all duration-200',
              'opacity-100',
            ].join(' ')}
          >
            <div className="container relative mx-auto flex min-w-[320px] items-center justify-between gap-2 px-4 py-2 md:py-3">
              <div className="flex min-w-0 items-center gap-2 md:gap-4">
                <BurgerMenu open={isBurgerOpen} onOpenChange={setIsBurgerOpen} />

                <Link
                  href="/"
                  className={[
                    'truncate uppercase',
                    'text-[22px] lg:text-[26px] xl:text-[30px]',
                    'leading-none font-extrabold tracking-[0.08em]',
                    'text-zinc-900',
                    'xl:absolute xl:left-1/2 xl:-translate-x-1/2',
                  ].join(' ')}
                  aria-label="Перейти на главную страницу"
                >
                  КЛЮЧ К СЕРДЦУ
                </Link>

                <div className="hidden flex-wrap items-center gap-4 text-sm text-black xl:flex">
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

                  <div className="flex items-center gap-2">
                    <a
                      href="https://wa.me/79886033821"
                      className="rounded-full border p-2 hover:bg-gray-100"
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
                      className="rounded-full border p-2 hover:bg-gray-100"
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
                      className="rounded-full border p-2 hover:bg-gray-100"
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

              <div className="relative flex items-center gap-2 lg:gap-3">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="rounded-full p-2 hover:bg-gray-100 focus:ring-2 focus:ring-black lg:p-2.5"
                  title="Поиск"
                  aria-controls="search-modal"
                >
                  <Image
                    src="/icons/search.svg"
                    alt="Поиск"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </button>

                <div className="hidden items-center gap-2 lg:flex xl:gap-3">
                  {isAuthenticated ? (
                    <div ref={profileRef} className="relative">
                      <button
                        onClick={() => setOpenProfile((p) => !p)}
                        className="rounded-full p-2 hover:bg-gray-100 focus:ring-2 focus:ring-black lg:rounded-full lg:border lg:px-4 lg:py-1"
                        aria-expanded={openProfile}
                      >
                        <div className="hidden items-center gap-2 xl:flex">
                          {bonus !== null && bonus >= 0 && (
                            <span className="rounded-full border px-2 py-[2px] text-xs font-semibold">
                              Бонусов: {bonus}
                            </span>
                          )}
                          <span>Профиль</span>
                        </div>

                        <Image
                          src="/icons/user.svg"
                          alt="Профиль"
                          width={20}
                          height={20}
                          className="h-5 w-5 xl:hidden"
                        />
                      </button>

                      <AnimatePresence>
                        {openProfile && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 z-50 mt-2 w-48 rounded-lg border bg-white shadow-lg"
                          >
                            <div className="py-1">
                              <Link
                                href="/account"
                                className="block px-4 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
                                onClick={() => setOpenProfile(false)}
                              >
                                Личный кабинет
                              </Link>

                              <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-2 text-left text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
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
                      className="rounded-full p-2 hover:bg-gray-100 focus:ring-2 focus:ring-black lg:rounded-full lg:border lg:px-4 lg:py-1"
                      aria-label="Войти в аккаунт"
                    >
                      <Image
                        src="/icons/user.svg"
                        alt="Вход"
                        width={20}
                        height={20}
                        className="h-5 w-5 xl:hidden"
                      />
                      <span className="hidden xl:inline">Вход</span>
                    </Link>
                  )}

                  <Link
                    href="/cart"
                    className="relative flex items-center gap-1 rounded-full p-2 hover:bg-gray-100 focus:ring-2 focus:ring-black lg:gap-2 lg:rounded-full lg:border lg:px-3 lg:py-1"
                    title="Корзина"
                    aria-label="Перейти в корзину"
                  >
                    <motion.div animate={cartControls} className="relative">
                      <Image
                        ref={cartIconRef as any}
                        src="/icons/shopping-cart.svg"
                        alt="Корзина"
                        width={20}
                        height={20}
                        className={`h-5 w-5 ${totalItems > 0 ? 'text-rose-500' : 'text-gray-900'}`}
                        loading="eager"
                      />

                      {totalItems > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-rose-500 text-xs font-semibold text-white shadow-sm">
                          {totalItems}
                        </span>
                      )}
                    </motion.div>

                    {cartSum > 0 && (
                      <span className="hidden text-base font-medium lg:block">
                        {formattedCartSum}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {flyBall}

          <div className="border-t">
            <CategoryNav
              initialCategories={initialCategories}
              showMobileFilter={showMobileFilter}
            />
          </div>
        </div>
      </header>

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
            <motion.div
              className={overlayClass}
              onClick={() => setIsSearchOpen(false)}
              aria-hidden="true"
            />

            <div className="relative mx-4 mt-16 w-full max-w-md sm:mt-20 md:max-w-2xl lg:mt-24">
              <motion.div
                className="z-10 rounded-2xl bg-white"
                initial={isAndroid ? { opacity: 0, y: 12 } : { scale: 0.96, opacity: 0 }}
                animate={isAndroid ? { opacity: 1, y: 0 } : { scale: 1, opacity: 1 }}
                exit={isAndroid ? { opacity: 0, y: 12 } : { scale: 0.96, opacity: 0 }}
                transition={
                  isAndroid
                    ? { duration: 0.18 }
                    : { type: 'spring', stiffness: 220, damping: 26, delay: 0.06 }
                }
              >
                <SearchModal
                  isOpen={isSearchOpen}
                  onClose={() => setIsSearchOpen(false)}
                />
              </motion.div>

              <motion.button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-4 top-4 text-gray-600 hover:text-black focus:ring-2 focus:ring-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, delay: 0.06 }}
                aria-label="Закрыть поиск"
              >
                <Image
                  src="/icons/x.svg"
                  alt="Закрыть"
                  width={24}
                  height={24}
                  loading="eager"
                />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}