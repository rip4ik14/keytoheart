'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import BurgerMenu from '@components/BurgerMenu';
import CategoryNav from '@components/CategoryNav';
import SearchModal from '@components/SearchModal';
import CookieBanner from '@components/CookieBanner';
import { useCart } from '@context/CartContext';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Database } from '@/lib/supabase/types_new';
import { Category } from '@/types/category';

// Хелпер для аналитики
const trackEvent = (eventName: string, category: string, params?: Record<string, any>) => {
  window.gtag?.('event', eventName, { event_category: category, ...params });
  window.ym?.(12345678, 'reachGoal', eventName, params);
};

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export default function StickyHeader({ initialCategories }: { initialCategories: Category[] }) {
  const pathname = usePathname() || '/';
  const { items } = useCart() as { items: CartItem[] };
  const cartSum = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const formattedCartSum = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(cartSum);

  const [session, setSession] = useState<any>(null);
  const [bonus, setBonus] = useState<number | null>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const phone = session?.user?.user_metadata?.phone as string | undefined;

  useEffect(() => {
    if (!phone) {
      setBonus(null);
      return;
    }
    supabase
      .from('bonuses')
      .select('bonus_balance')
      .eq('phone', phone)
      .single()
      .then(({ data, error }) => {
        if (!error) setBonus(data?.bonus_balance ?? 0);
      });
  }, [phone, supabase]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpenProfile(false);
    toast.success('Вы вышли из аккаунта');
    trackEvent('sign_out', 'header');
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-white border-b shadow-sm"
        aria-label="Основная навигация"
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-2 sm:py-3 gap-2 min-w-[320px]">
          {/* Left Section: Burger Menu and Logo */}
          <div className="flex items-center gap-2">
            <BurgerMenu />
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold"
              aria-label="Перейти на главную страницу"
            >
              KeytoHeart
            </Link>
          </div>

          {/* Right Section: Search, Profile, Cart */}
          <div className="flex items-center gap-2">
            <button
              ref={searchButtonRef}
              onClick={() => {
                setIsSearchOpen(true);
                trackEvent('open_search', 'header');
              }}
              className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black"
              title="Поиск"
              aria-label="Открыть поиск"
              aria-controls="search-modal"
            >
              <Image
                src="/icons/search.svg"
                alt="Search"
                width={20}
                height={20}
                className="w-5 h-5 text-black"
                loading="lazy"
              />
            </button>

            {session ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setOpenProfile((p) => !p)}
                  className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black"
                  aria-label="Открыть меню профиля"
                  aria-expanded={openProfile}
                  aria-controls="profile-menu"
                >
                  <Image
                    src="/icons/user.svg"
                    alt="Profile"
                    width={20}
                    height={20}
                    className="w-5 h-5 text-black"
                    loading="lazy"
                  />
                </button>

                <AnimatePresence>
                  {openProfile && (
                    <motion.div
                      id="profile-menu"
                      className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border z-50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      role="menu"
                      aria-label="Меню профиля"
                    >
                      <div className="py-1">
                        {bonus !== null && (
                          <div className="px-4 py-2 text-sm text-gray-700">
                            Бонусов: {bonus}
                          </div>
                        )}
                        <Link
                          href="/account"
                          className="block px-4 py-2 text-sm text-black hover:bg-gray-100 focus:bg-gray-100 outline-none"
                          onClick={() => {
                            setOpenProfile(false);
                            trackEvent('profile_account_click', 'header');
                          }}
                          role="menuitem"
                          aria-current={pathname === '/account' ? 'page' : undefined}
                        >
                          Личный кабинет
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 focus:bg-gray-100 outline-none"
                          role="menuitem"
                          aria-label="Выйти из аккаунта"
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
                className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black"
                onClick={() => trackEvent('login_click', 'header')}
                aria-label="Войти в аккаунт"
                aria-current={pathname === '/account' ? 'page' : undefined}
              >
                <Image
                  src="/icons/user.svg"
                  alt="Login"
                  width={20}
                  height={20}
                  className="w-5 h-5 text-black"
                  loading="lazy"
                />
              </Link>
            )}

            <Link
              href="/cart"
              className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black"
              title="Корзина"
              aria-label="Перейти в корзину"
              aria-current={pathname === '/cart' ? 'page' : undefined}
              onClick={() => trackEvent('cart_click', 'header')}
            >
              <Image
                src="/icons/shopping-cart.svg"
                alt="Shopping Cart"
                width={20}
                height={20}
                className="w-5 h-5 text-black"
                loading="lazy"
              />
              {cartSum > 0 && (
                <span className="text-xs font-medium">{formattedCartSum}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Category Navigation - Collapsible on Mobile */}
        <div className="border-t">
          <CategoryNav initialCategories={initialCategories} />
        </div>
      </header>

      {/* Search Modal Optimized for Mobile */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            id="search-modal"
            className="fixed inset-0 z-[9999] flex items-start justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Модальное окно поиска"
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onClick={() => setIsSearchOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-md sm:max-w-2xl mx-4 mt-16 sm:mt-24">
              <motion.div
                className="w-full rounded-2xl bg-white z-10"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
              >
                <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
              </motion.div>
              <motion.button
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                aria-label="Закрыть поиск"
              >
                <Image
                  src="/icons/x.svg"
                  alt="Close"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                  loading="lazy"
                />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CookieBanner />
    </>
  );
}