'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Star, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/product';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { triggerCartAnimation } = useCartAnimation();
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Защита от null/undefined
  const images = Array.isArray(product.images) ? product.images : [];
  const imageUrl = images[0] || '/placeholder.jpg';
  const bonus = product.bonus || Math.floor(product.price * 0.025);
  const discountPercent = product.discount_percent ?? 0;
  const originalPrice = product.original_price || product.price;
  // Цена со скидкой
  const discountedPrice =
    discountPercent > 0 ? Math.round(product.price * (1 - discountPercent / 100)) : product.price;
  // Сумма скидки
  const discountAmount =
    discountPercent > 0
      ? (originalPrice > product.price
          ? originalPrice
          : product.price) - discountedPrice
      : 0;
  const isPopular = product.is_popular;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showButton = hovered || isMobile;

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    hiddenDesktop: { opacity: 0, scale: 0.85 },
    visibleDesktop: { opacity: 1, scale: 1, transition: { duration: 0.13, ease: 'easeOut' } },
  };

  const handleAddToCart = () => {
    const item = {
      id: product.id.toString(),
      title: product.title,
      price: discountedPrice,
      quantity: 1,
      imageUrl,
    };
    addItem(item);
    if (isMobile && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      triggerCartAnimation(startX, startY, imageUrl);
    }
    toast.success('Товар добавлен в корзину');
    window.gtag?.('event', 'add_to_cart', { event_category: 'product', product_id: product.id });
    window.ym?.(12345678, 'reachGoal', 'add_to_cart', { product_id: product.id });
  };

  return (
    <motion.div
      className={`
        relative flex flex-col w-full max-w-[250px] mx-auto
        bg-white group
        rounded-xl sm:rounded-[22px]
        border border-gray-200 sm:border-transparent
        overflow-hidden sm:overflow-visible
        shadow-sm sm:shadow-none group-hover:shadow-md sm:group-hover:shadow-[0_6px_28px_0_rgba(0,0,0,0.14)] sm:group-hover:border-black/14
        transition-all duration-200
        sm:h-[361px]
      `}
      style={{
        ...(isMobile
          ? {}
          : {
              boxShadow: hovered
                ? '0 6px 28px 0 rgba(0,0,0,0.14)'
                : '0 1px 6px 0 rgba(0,0,0,0.03)',
              transition:
                'box-shadow 0.14s cubic-bezier(.4,0,.2,1), border-color 0.13s cubic-bezier(.4,0,.2,1)',
            }),
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.17 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
      tabIndex={0}
    >
      {/* Стикер бонуса */}
      {bonus > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center px-2 py-1 bg-white rounded-full shadow text-xs sm:text-[10px] font-semibold text-black sm:min-h-[18px] sm:min-h-[20px] border border-gray-100 sm:border-gray-100">
          +{bonus}₽
        </div>
      )}
      {/* Стикер "Популярно" (только на десктопе) */}
      {isPopular && !isMobile && (
        <div className="absolute top-2 right-2 z-20 bg-black text-white sm:text-[12px] px-1.5 sm:px-2 py-0.5 rounded-full flex items-center font-bold">
          <Star size={13} className="text-yellow-400 mr-1" />
          Популярно
        </div>
      )}
      {/* Картинка */}
      <Link
        href={`/product/${product.id}`}
        className="block relative w-full h-64 sm:h-[260px] rounded-xl sm:rounded-[20px] overflow-hidden"
        tabIndex={-1}
        aria-label={`Перейти к товару ${product.title}`}
      >
        <div className="relative w-full h-full rounded-xl sm:rounded-[20px] overflow-hidden bg-white sm:bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105 sm:group-hover:scale-102"
            sizes="(max-width: 640px) 100vw, 265px"
            loading="lazy"
            draggable={false}
          />
        </div>
        {/* Точки-слайдер, если есть несколько фото (только на десктопе) */}
        {!isMobile && images.length > 1 && (
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-black' : 'bg-black/20'}`}
              />
            ))}
          </div>
        )}
      </Link>
      {/* Контент */}
      <div className="flex flex-col flex-1 p-4 sm:px-2 sm:pt-2 sm:pb-1.5">
        <h3
          id={`product-${product.id}-title`}
          className="text-base sm:text-[15px] font-medium text-black sm:mb-1 text-center sm:line-clamp-2 sm:h-[38px] sm:leading-[1.18] sm:break-words break-words"
        >
          {product.title}
        </h3>
        {/* Цена и скидка в стиле Labberry (по центру, в 2 строки) */}
        {discountAmount > 0 && !isMobile ? (
          <div className="flex flex-col items-center justify-center mt-1 w-full">
            <div className="flex flex-row items-center justify-center mb-1 w-full">
              {/* Старая цена */}
              <span className="text-base text-gray-400 line-through mr-2 select-none whitespace-nowrap">
                {(originalPrice > product.price ? originalPrice : product.price) + '₽'}
              </span>
              {/* Сумма скидки */}
              <span className="bg-black text-white rounded-md px-2 py-0.5 text-xs font-bold ml-1 min-w-[38px] text-center">
                {'-' + discountAmount + '₽'}
              </span>
            </div>
            {/* Текущая цена */}
            <span className="text-2xl font-extrabold text-black leading-tight text-center">
              {discountedPrice}₽
            </span>
          </div>
        ) : discountAmount > 0 && isMobile ? (
          // Мобильная версия скидки — без изменений
          <div className="flex flex-col items-center">
            <span className="text-black font-bold text-base">{discountedPrice} ₽</span>
            <span className="text-sm text-gray-400 line-through">{product.price} ₽</span>
          </div>
        ) : originalPrice > product.price && !isMobile ? (
          <div className="flex flex-col items-center justify-center mt-1 w-full">
            <div className="flex flex-row items-center justify-center mb-1 w-full">
              <span className="text-base text-gray-400 line-through mr-2 select-none whitespace-nowrap">
                {originalPrice}₽
              </span>
            </div>
            <span className="text-2xl font-extrabold text-black leading-tight text-center">
              {product.price}₽
            </span>
          </div>
        ) : (
          <span className="text-black font-bold text-2xl text-center w-full block">{product.price}₽</span>
        )}
        {/* Кнопка "В корзину" */}
        <AnimatePresence>
          {showButton && (
            <motion.button
              ref={buttonRef}
              onClick={handleAddToCart}
              className={`
                mt-2 sm:mt-auto
                bg-black text-white text-sm sm:text-[16px] font-bold px-6 sm:px-3 py-2 sm:py-1.5 rounded-md sm:rounded-2xl
                shadow transition hover:bg-gray-800 sm:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black
                w-full
              `}
              initial={isMobile ? 'hidden' : 'hiddenDesktop'}
              animate={isMobile ? 'visible' : 'visibleDesktop'}
              exit={isMobile ? 'hidden' : 'hiddenDesktop'}
              variants={buttonVariants}
              style={{ transformOrigin: 'center' }}
              aria-label={`Добавить ${product.title} в корзину`}
              tabIndex={0}
            >
              {isMobile ? (
                'В корзину'
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart size={19} />
                  В корзину
                </div>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
