'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import BurgerMenu from '@components/BurgerMenu';
import CategoryNav from '@components/CategoryNav';
import SearchModal from '@components/SearchModal';
import CookieBanner from '@components/CookieBanner';
import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Category } from '@/types/category';

type StickyHeaderProps = {
  initialCategories: Category[];
};

export default function StickyHeader({ initialCategories }: StickyHeaderProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { items } = useCart() as { items: { price: number; quantity: number; imageUrl: string }[] };
  const {
    animationState,
    setAnimationState,
    setCartIconPosition,
    cartIconPosition,
  } = useCartAnimation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bonus, setBonus] = useState<number | null>(null);

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
  const profileRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const cartIconRef = useRef<HTMLImageElement>(null);
  const cartControls = useAnimation();
  const [isFlying, setIsFlying] = useState(false);

  // Проверка авторизации и загрузка бонусов
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session', {
          method: 'GET',
          credentials: 'include',
        });
        const sessionData = await response.json();
        
        if (isMounted) {
          if (sessionData.isAuthenticated) {
            const phone = sessionData.phone;
            if (phone) {
              const normalizedPhone = formatPhone(phone);
              setIsAuthenticated(true);
              try {
                const bonusRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`);
                const bonusJson = await bonusRes.json();
                if (bonusRes.ok && bonusJson.success) {
                  setBonus(bonusJson.data.bonus_balance ?? 0);
                } else {
                  setBonus(null);
                }
              } catch (error) {
                process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} StickyHeader: Error loading bonuses`, error);
                setBonus(null);
              }
            } else {
              setIsAuthenticated(false);
              setBonus(null);
            }
          } else {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
              const phone = session.user.user_metadata?.phone as string | undefined;
              if (phone) {
                const normalizedPhone = formatPhone(phone);
                setIsAuthenticated(true);
                try {
                  const bonusRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`);
                  const bonusJson = await bonusRes.json();
                  
                  if (bonusRes.ok && bonusJson.success) {
                    setBonus(bonusJson.data.bonus_balance ?? 0);
                  } else {
                    setBonus(null);
                  }
                } catch (error) {
                  process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} StickyHeader: Error loading bonuses (Supabase)`, error);
                  setBonus(null);
                }
              } else {
                setIsAuthenticated(false);
                setBonus(null);
              }
            } else {
              setIsAuthenticated(false);
              setBonus(null);
            }
          }
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} StickyHeader: Error checking session`, error);
        if (isMounted) {
          setIsAuthenticated(false);
          setBonus(null);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      
      if (isMounted) {
        if (session?.user) {
          const phone = session.user.user_metadata?.phone as string | undefined;
          if (phone) {
            const normalizedPhone = formatPhone(phone);
            setIsAuthenticated(true);
            fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`)
              .then((res) => res.json())
              .then((bonusJson) => {
                
                if (isMounted && bonusJson.success) {
                  setBonus(bonusJson.data.bonus_balance ?? 0);
                } else if (isMounted) {
                  setBonus(null);
                }
              })
              .catch((error) => {
                process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} StickyHeader: Error loading bonuses after auth change`, error);
                if (isMounted) setBonus(null);
              });
          } else {
            setIsAuthenticated(false);
            setBonus(null);
          }
        } else {
          setIsAuthenticated(false);
          setBonus(null);
        }
      }
    });

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'supabase.auth.token') {
        
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleAuthChange = () => {
      
      checkAuth();
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const formatPhone = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('8')) cleaned = '7' + cleaned.slice(1);
    if (!cleaned.startsWith('7')) cleaned = '7' + cleaned;
    return `+${cleaned.slice(0, 11)}`;
  };

  useEffect(() => {
    if (totalItems > 0 && previousTotalItems === 0) {
      cartControls.start({
        scale: [1, 1.3, 1],
        rotate: [0, 10, -10, 0],
        transition: { duration: 0.5, ease: 'easeInOut', repeat: 1 },
      });
    }
    setPreviousTotalItems(totalItems);
  }, [totalItems, cartControls, previousTotalItems]);

  useEffect(() => {
    const updatePos = () => {
      const el = cartIconRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setCartIconPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos);
    };
  }, [setCartIconPosition]);

  useEffect(() => {
    if (animationState.isAnimating) setIsFlying(true);
  }, [animationState]);

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
    try {
      await supabase.auth.signOut();
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        setIsAuthenticated(false);
        setBonus(null);
        setOpenProfile(false);
        toast.success('Вы вышли из аккаунта');
        window.dispatchEvent(new Event('authChange'));
        router.refresh();
      } else {
        throw new Error('Failed to logout');
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} StickyHeader: Error signing out`, error);
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

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm" aria-label="Основная навигация">
        <div className="container mx-auto flex items-center justify-between px-4 py-2 md:py-3 gap-2 min-w-[320px] relative">
          {/* Левый блок */}
          <div className="flex items-center gap-2 md:gap-4">
            <BurgerMenu />
            <Link
              href="/"
              className="text-lg md:text-2xl font-bold md:absolute md:left-1/2 md:transform md:-translate-x-1/2 truncate"
              aria-label="Перейти на главную страницу"
            >
              KEY TO HEART
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
                <span className="text-xs text-gray-400">с 08:00 до 22:00</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://wa.me/79886033821"
                  className="border rounded-full p-2 hover:bg-gray-100"
                  title="WhatsApp"
                  aria-label="Перейти в WhatsApp"
                  rel="nofollow"
                >
                  <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={16} height={16} loading="lazy" />
                </a>
                <a
                  href="https://t.me/keytomyheart"
                  className="border rounded-full p-2 hover:bg-gray-100"
                  title="Telegram"
                  aria-label="Перейти в Telegram"
                  rel="nofollow"
                >
                  <Image src="/icons/telegram.svg" alt="Telegram" width={16} height={16} loading="lazy" />
                </a>
              </div>
            </div>
          </div>

          {/* Правый блок */}
          <div className="flex items-center gap-2 md:gap-3 relative">
            <button
              ref={searchButtonRef}
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black md:p-2.5 md:hover:text-rose-500 md:focus:text-rose-500"
              title="Поиск"
              aria-controls="search-modal"
            >
              <Image
                src="/icons/search.svg"
                alt="Поиск"
                width={20}
                height={20}
                className="w-5 h-5 text-gray-900 fill-current md:w-7 md:h-7"
                loading="lazy"
              />
            </button>

            {isAuthenticated ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setOpenProfile((p) => !p)}
                  className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black md:p-2.5 md:hover:text-rose-500 md:focus:text-rose-500 md:flex md:items-center md:gap-2 md:px-4 md:py-1 md:border md:rounded-full"
                  aria-expanded={openProfile}
                >
                  <Image
                    src="/icons/user.svg"
                    alt="Профиль"
                    width={20}
                    height={20}
                    className="w-5 h-5 text-gray-900 fill-current md:w-7 md:h-7 md:hidden"
                    loading="lazy"
                  />
                  <div className="hidden md:flex items-center gap-2">
                    {bonus !== null && bonus >= 0 && (
                      <span className="rounded-full border px-2 py-[2px] text-xs font-semibold">
                        Бонусов: {bonus}
                      </span>
                    )}
                    <span>Профиль</span>
                  </div>
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
                        {bonus !== null && bonus >= 0 && (
                          <div className="px-4 py-2 text-sm text-gray-700 md:hidden">
                            Бонусов: {bonus}
                          </div>
                        )}
                        <Link
                          href="/account"
                          className="block px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none"
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
                className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black md:p-2.5 md:hover:text-rose-500 md:focus:text-rose-500 md:px-4 md:py-1 md:border md:rounded-full"
                aria-label="Войти в аккаунт"
              >
                <Image
                  src="/icons/user.svg"
                  alt="Вход"
                  width={20}
                  height={20}
                  className="w-5 h-5 text-gray-900 fill-current md:w-7 md:h-7 md:hidden"
                  loading="lazy"
                />
                <span className="hidden md:inline">Вход</span>
              </Link>
            )}

            <Link
              href="/cart"
              className="relative flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black md:p-2.5 md:gap-2 md:border md:px-3 md:py-1 md:rounded-full"
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
                  className={`w-5 h-5 fill-current md:w-7 md:h-7 ${totalItems > 0 ? 'text-rose-500' : 'text-gray-900'}`}
                  loading="lazy"
                />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-white md:-top-2 md:-right-2">
                    {totalItems}
                  </span>
                )}
              </motion.div>
              {cartSum > 0 && (
                <span className="hidden sm:block text-base font-medium">{formattedCartSum}</span>
              )}
            </Link>
          </div>
        </div>

        {flyBall}

        <div className="border-t">
          <CategoryNav initialCategories={initialCategories} />
        </div>
      </header>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            id="search-modal"
            className="fixed inset-0 z-[9999] flex items-start justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-md sm:max-w-2xl mx-4 mt-16 sm:mt-24">
              <motion.div
                className="bg-white rounded-2xl z-10"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
              >
                <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
              </motion.div>
              <motion.button
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black focus:ring-2 focus:ring-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                aria-label="Закрыть поиск"
              >
                <Image src="/icons/x.svg" alt="Закрыть" width={24} height={24} loading="lazy" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CookieBanner />
    </>
  );
}