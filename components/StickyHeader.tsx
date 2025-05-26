'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import BurgerMenu from '@components/BurgerMenu';
import CategoryNav from '@components/CategoryNav';
import SearchModal from '@components/SearchModal';
import CookieBanner from '@components/CookieBanner';
import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Category } from '@/types/category';

type StickyHeaderProps = {
  initialCategories: Category[];
  isAuthenticated: boolean;
  bonus?: number | null;
};

export default function StickyHeader({
  initialCategories,
  isAuthenticated: initialIsAuthenticated,
  bonus: initialBonus = null,
}: StickyHeaderProps) {
  const pathname = usePathname() || '/';
  const { items } = useCart() as { items: { price: number; quantity: number; imageUrl: string }[] };
  const {
    animationState,
    setAnimationState,
    setCartIconPosition,
    cartIconPosition,
  } = useCartAnimation();

  const cartSum = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const formattedCartSum = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(cartSum);

  const [isAuth, setIsAuth] = useState(initialIsAuthenticated);
  const [bonus, setBonus] = useState<number | null>(initialBonus);
  const [openProfile, setOpenProfile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const cartIconRef = useRef<HTMLImageElement>(null);
  const cartControls = useAnimation();
  const [isFlying, setIsFlying] = useState(false);

  // Проверка сессии через API
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const json = await res.json();
        if (res.ok && json.user) {
          setIsAuth(true);
          const phone = json.user.phone;
          // Запрашиваем бонусы
          const bonusRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(phone)}`);
          const bonusJson = await bonusRes.json();
          if (bonusRes.ok && bonusJson.success) {
            setBonus(bonusJson.data.bonus_balance ?? 0);
          } else {
            setBonus(null);
          }
        } else {
          setIsAuth(false);
          setBonus(null);
        }
      } catch (error) {
        console.error('Ошибка проверки сессии:', error);
        setIsAuth(false);
        setBonus(null);
      }
    };

    checkSession();
  }, []);

  // Анимация корзины
  useEffect(() => {
    if (totalItems > 0) {
      cartControls.start({ scale: [1, 1.2, 1], transition: { duration: 0.3, ease: 'easeInOut' } });
    }
  }, [totalItems, cartControls]);

  // Позиция иконки корзины
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

  // Полёт товара в корзину
  useEffect(() => {
    if (animationState.isAnimating) setIsFlying(true);
  }, [animationState]);

  // Закрытие профиля при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Выход из аккаунта
  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setIsAuth(false);
        setBonus(null);
        setOpenProfile(false);
        toast.success('Вы вышли из аккаунта');
      } else {
        throw new Error('Ошибка выхода');
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
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
              className="text-xl md:text-2xl font-bold md:absolute md:left-1/2 md:transform md:-translate-x-1/2"
              aria-label="Перейти на главную страницу"
            >
              Key to Heart
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
              className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-black"
              title="Поиск"
              aria-controls="search-modal"
            >
              <Image src="/icons/search.svg" alt="Поиск" width={20} height={20} loading="lazy" />
            </button>

            {isAuth ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setOpenProfile((p) => !p)}
                  className="p-2 hover:bg-gray-100 rounded-full md:flex md:items-center md:gap-2 md:px-4 md:py-1 md:border md:rounded-full focus:ring-2 focus:ring-black"
                  aria-expanded={openProfile}
                >
                  <Image
                    src="/icons/user.svg"
                    alt="Профиль"
                    width={20}
                    height={20}
                    className="w-5 h-5 text-black md:hidden"
                    loading="lazy"
                  />
                  <div className="hidden md:flex items-center gap-2">
                    {bonus !== null && bonus > 0 && (
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
                        {bonus !== null && bonus > 0 && (
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
                className="p-2 hover:bg-gray-100 rounded-full md:px-4 md:py-1 md:border md:rounded-full focus:ring-2 focus:ring-black"
              >
                <Image src="/icons/user.svg" alt="Вход" width={20} height={20} loading="lazy" />
                <span className="hidden md:inline">Вход</span>
              </Link>
            )}

            <Link
              href="/cart"
              className="relative flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full md:border md:px-3 md:py-1 md:rounded-full focus:ring-2 focus:ring-black"
            >
              <motion.div animate={cartControls}>
                <Image
                  ref={cartIconRef}
                  src="/icons/shopping-cart.svg"
                  alt="Корзина"
                  width={20}
                  height={20}
                  loading="lazy"
                />
              </motion.div>
              {cartSum > 0 && (
                <span className="text-xs md:text-sm font-medium">{formattedCartSum}</span>
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