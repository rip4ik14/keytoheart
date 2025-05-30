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

  // Данные
  const images = Array.isArray(product.images) ? product.images : [];
  const imageUrl = images[0] || '/placeholder.jpg';
  const bonus = product.bonus || Math.floor(product.price * 0.025);
  const discountPercent = product.discount_percent ?? 0;
  const originalPrice = product.original_price || product.price;
  const discountedPrice =
    discountPercent > 0
      ? Math.round(product.price * (1 - discountPercent / 100))
      : product.price;
  const discountAmount =
    discountPercent > 0
      ? (originalPrice > product.price ? originalPrice : product.price) -
        discountedPrice
      : 0;
  const isPopular = product.is_popular;

  // Определяем мобильный режим
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Показываем кнопку по hover на десктопе и сразу на мобилке
  const showButton = hovered || isMobile;

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    hiddenDesktop: { opacity: 0, scale: 0.85 },
    visibleDesktop: { opacity: 1, scale: 1, transition: { duration: 0.13, ease: 'easeOut' } },
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id.toString(),
      title: product.title,
      price: discountedPrice,
      quantity: 1,
      imageUrl,
    });
    if (isMobile && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      triggerCartAnimation(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        imageUrl
      );
    }
    toast.success('Товар добавлен в корзину');
  };

  return (
    <motion.div
      className={`
        relative flex flex-col w-full
        max-w-[280px] sm:max-w-[300px]
        mx-auto sm:mx-2
        bg-white group
        rounded-xl sm:rounded-[22px]
        border border-gray-200 sm:border-transparent
        overflow-hidden sm:overflow-visible
        shadow-sm sm:shadow-none group-hover:shadow-md
        sm:group-hover:shadow-[0_6px_28px_0_rgba(0,0,0,0.14)]
        sm:group-hover:border-black/14
        transition-all duration-200
        sm:h-[420px] h-full
      `}
      style={
        !isMobile
          ? {
              boxShadow: hovered
                ? '0 6px 28px rgba(0,0,0,0.14)'
                : '0 1px 6px rgba(0,0,0,0.03)',
              transition:
                'box-shadow 0.14s cubic-bezier(.4,0,.2,1), border-color 0.13s cubic-bezier(.4,0,.2,1)',
            }
          : {}
      }
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.17 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
      tabIndex={0}
    >
      {/* Бонус */}
      {bonus > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center px-2 py-1 bg-white rounded-full shadow text-xs sm:text-[10px] font-semibold text-black border border-gray-100">
          +{bonus}₽
        </div>
      )}

      {/* Популярно */}
      {isPopular && !isMobile && (
        <div className="absolute top-2 right-2 z-20 bg-black text-white text-sm px-2 py-0.5 rounded-full flex items-center font-bold">
          <Star size={13} className="text-yellow-400 mr-1" />
          Популярно
        </div>
      )}

      {/* Изображение — ещё выше */}
      <Link
        href={`/product/${product.id}`}
        className="block relative w-full h-96 sm:h-[380px] rounded-xl sm:rounded-[20px] overflow-hidden"
        tabIndex={-1}
        aria-label={`Перейти к товару ${product.title}`}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105 sm:group-hover:scale-102"
          sizes="(max-width: 640px) 100vw, 380px"
        />
        {!isMobile && images.length > 1 && (
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  idx === 0 ? 'bg-black' : 'bg-black/20'
                }`}
              />
            ))}
          </div>
        )}
      </Link>

      {/* Описание + Цена */}
      <div className="flex flex-col flex-1 p-4 sm:px-2 sm:pt-2 sm:pb-1.5 min-h-[160px]">
        <h3
          id={`product-${product.id}-title`}
          className="text-base sm:text-[15px] font-medium text-black text-center sm:line-clamp-2 break-words"
        >
          {product.title}
        </h3>

        {!isMobile ? (
          discountAmount > 0 ? (
            <div className="flex flex-col items-center mt-1">
              <div className="flex items-center mb-1">
                <span className="text-base text-gray-400 line-through mr-2">
                  {(originalPrice > product.price ? originalPrice : product.price) + '₽'}
                </span>
                <span className="bg-black text-white rounded-md px-2 py-0.5 text-xs font-bold">
                  -{discountAmount}₽
                </span>
              </div>
              <span className="text-2xl font-bold text-black">
                {discountedPrice}₽
              </span>
            </div>
          ) : originalPrice > product.price ? (
            <div className="flex flex-col items-center mt-1">
              <span className="text-base text-gray-400 line-through">{originalPrice}₽</span>
              <span className="text-2xl font-bold text-black">{product.price}₽</span>
            </div>
          ) : (
            <div className="flex justify-center mt-1">
              <span className="text-2xl font-bold text-black">{product.price}₽</span>
            </div>
          )
        ) : discountAmount > 0 ? (
          <div className="flex flex-col items-center mt-1">
            <span className="text-black font-bold text-base">{discountedPrice} ₽</span>
            <span className="text-sm text-gray-400 line-through">{product.price} ₽</span>
          </div>
        ) : originalPrice > product.price ? (
          <div className="flex flex-col items-center mt-1">
            <span className="text-black font-bold text-base">{product.price} ₽</span>
            <span className="text-sm text-gray-400 line-through">{originalPrice} ₽</span>
          </div>
        ) : (
          <span className="text-black font-bold text-base mt-1">{product.price} ₽</span>
        )}

        {/* Кнопка */}
        <AnimatePresence>
          {showButton && (
            <motion.button
              ref={buttonRef}
              onClick={handleAddToCart}
              className="
                mt-auto flex items-center justify-center gap-2
                border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                bg-white text-[#535353] transition-all duration-200 shadow-sm
                hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]
                w-full
              "
              initial={isMobile ? 'hidden' : 'hiddenDesktop'}
              animate={isMobile ? 'visible' : 'visibleDesktop'}
              exit={isMobile ? 'hidden' : 'hiddenDesktop'}
              variants={buttonVariants}
              style={{ transformOrigin: 'center' }}
              aria-label={`Добавить ${product.title} в корзину`}
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