'use client';

import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Star, ShoppingCart } from 'lucide-react';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import type { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const { triggerCartAnimation } = useCartAnimation();
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const stablePriority = useRef(priority).current;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const images = Array.isArray(product.images) ? product.images : [];
  const imageUrl = images[0] || '/placeholder.jpg';
  const bonus = product.bonus ?? Math.floor(product.price * 0.025);
  const discountPercent = product.discount_percent ?? 0;
  const originalPrice = product.original_price || product.price;
  const discountedPrice = discountPercent
    ? Math.round(product.price * (1 - discountPercent / 100))
    : product.price;
  const discountAmount = discountPercent
    ? (originalPrice > product.price ? originalPrice : product.price) - discountedPrice
    : 0;
  const isPopular = product.is_popular;

  const handleAddToCart = () => {
    addItem({
      id: product.id.toString(),
      title: product.title,
      price: discountedPrice,
      quantity: 1,
      imageUrl,
      production_time: product.production_time ?? null,
    });
    YM_ID && callYm(YM_ID, 'reachGoal', 'add_to_cart');
    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      triggerCartAnimation(r.left + r.width / 2, r.top + r.height / 2, imageUrl);
    }
    toast.success('Товар добавлен в корзину', { id: `add-${product.id}` });
  };

  function declineWord(num: number, words: [string, string, string]): string {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[(num % 100 > 4 && num % 100 < 20) ? 2 : cases[(num % 10 < 5) ? num % 10 : 5]];
  }
  function formatTimeFull(minutes: number | null): string | null {
    if (minutes == null || minutes <= 0) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let r = '';
    if (h) r += `${h} ${declineWord(h, ['час', 'часа', 'часов'])}`;
    if (m) r += `${r ? ' ' : ''}${m} ${declineWord(m, ['минута', 'минуты', 'минут'])}`;
    return r || 'Мгновенно';
  }
  function formatTimeShort(minutes: number | null): string | null {
    if (minutes == null || minutes <= 0) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hh = h ? `${h} ч` : '';
    const mm = m ? `${m} мин` : '';
    return [hh, mm].filter(Boolean).join(' ');
  }

  const TIME_ROW_MIN_H = '1.25rem'; // для десктопа — одна строка

  return (
    <motion.div
      className="relative flex flex-col w-full max-w-[220px] sm:max-w-[280px] mx-auto bg-white rounded-[18px] min-h-[370px] sm:min-h-[420px] border border-gray-200 shadow-sm overflow-hidden transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Стикеры */}
      {bonus > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center px-2 py-1 bg-white rounded-full shadow text-[11px] font-semibold text-black border border-gray-100">
          +{bonus}₽
        </div>
      )}
      {isPopular && (
        <div className="absolute top-2 right-2 z-20 bg-black text-white text-[10px] sm:text-sm px-2 py-0.5 rounded-full flex items-center font-bold">
          <Star size={12} className="text-yellow-400 mr-1" />
          Популярно
        </div>
      )}

      {/* Изображение */}
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-[3/4] overflow-hidden"
        aria-label={product.title}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          loading={stablePriority ? 'eager' : 'lazy'}
          priority={stablePriority}
          sizes="(max-width:640px) 100vw, 280px"
        />
      </Link>

      {/* Контент */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 pb-12 sm:pb-14">
        {/* Заголовок:
            - на мобиле показываем полностью;
            - на sm+ фиксируем на 3 строки, чтобы выровнять низ. */}
        <h3
          className="sm:hidden text-sm sm:text-[15px] font-medium text-black text-center leading-5 whitespace-normal break-words"
          title={product.title}
        >
          {product.title}
        </h3>
        <h3
          className="hidden sm:block text-sm sm:text-[15px] font-medium text-black text-center leading-5"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '3.75rem', // 3 * 1.25rem
          }}
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Spacer — прижимает цену/время к низу перед кнопкой */}
        <div className="mt-auto" />

        {/* Цена + Время */}
        <div className="flex flex-col items-center">
          {(discountAmount > 0 || originalPrice > product.price) && (
            <div className="flex items-center mb-1">
              <span className="text-xs text-gray-400 line-through mr-2">
                {originalPrice > product.price ? originalPrice : product.price}₽
              </span>
              {discountAmount > 0 && (
                <span className="bg-black text-white rounded px-1.5 py-0.5 text-[11px] font-bold">
                  -{discountAmount}₽
                </span>
              )}
            </div>
          )}

          <span className="text-lg sm:text-xl font-bold text-black">
            {discountAmount > 0 ? discountedPrice : product.price}₽
          </span>

          {/* Время:
              - на мобиле — полный текст, можно переносы;
              - на sm+ — короткий формат, одна строка фикс высоты. */}
          {product.production_time ? (
            <>
              <p
                className="sm:hidden mt-1 text-xs sm:text-sm text-gray-500 text-center leading-5 whitespace-normal break-words"
                title={`Время изготовления: ${formatTimeFull(product.production_time)}`}
              >
                Время изготовления: {formatTimeFull(product.production_time)}
              </p>
              <p
                className="hidden sm:block mt-1 text-xs sm:text-sm text-gray-500 text-center truncate whitespace-nowrap"
                style={{ minHeight: TIME_ROW_MIN_H }}
                title={`Время изготовления: ${formatTimeFull(product.production_time)}`}
              >
                Время изготовления: {formatTimeShort(product.production_time)}
              </p>
            </>
          ) : (
            <div className="mt-1 h-5" />
          )}
        </div>
      </div>

      {/* Кнопка */}
      <div className="absolute left-0 bottom-0 w-full px-2 sm:px-3 z-10">
        {isMobile ? (
          <button
            ref={buttonRef}
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center bg-white border border-gray-300 text-black rounded-b-[18px] font-bold text-base hover:bg-black hover:text-white transition-all duration-200 h-10"
            aria-label={`Добавить ${product.title} в корзину`}
          >
            <ShoppingCart size={20} className="mr-2" />
            <span className="uppercase tracking-wider">В корзину</span>
          </button>
        ) : (
          <AnimatePresence>
            {hovered && (
              <motion.button
                ref={buttonRef}
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center bg-white border border-gray-300 text-black rounded-b-[18px] font-bold text-base hover:bg-black hover:text-white transition-all duration-200 h-10"
                aria-label={`Добавить ${product.title} в корзину`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <ShoppingCart size={20} className="mr-2" />
                <span className="uppercase tracking-wider">В корзину</span>
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
