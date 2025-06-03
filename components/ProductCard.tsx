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
  /* ----------------------- state & refs ----------------------- */
  const { addItem } = useCart();
  const { triggerCartAnimation } = useCartAnimation();

  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* ----------------------- derived data ----------------------- */
  const images = Array.isArray(product.images) ? product.images : [];
  const imageUrl = images[0] || '/placeholder.jpg';
  const bonus = product.bonus || Math.floor(product.price * 0.025);
  const discountPercent = product.discount_percent ?? 0;
  const originalPrice = product.original_price || product.price;
  const discountedPrice = discountPercent
    ? Math.round(product.price * (1 - discountPercent / 100))
    : product.price;
  const discountAmount = discountPercent
    ? (originalPrice > product.price ? originalPrice : product.price) - discountedPrice
    : 0;
  const isPopular = product.is_popular;

  /* ----------------------- hooks ----------------------- */
  // Гидратация + мобильный брейк-поинт
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ----------------------- handlers ----------------------- */
  const handleAddToCart = () => {
    addItem({
      id: product.id.toString(),
      title: product.title,
      price: discountedPrice,
      quantity: 1,
      imageUrl,
    });

    if (isMobile && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      triggerCartAnimation(r.left + r.width / 2, r.top + r.height / 2, imageUrl);
    }
    toast.success('Товар добавлен в корзину');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddToCart();
    }
  };

  /* ----------------------- JSX ----------------------- */
  return (
    <div
      ref={cardRef}
      className="relative flex flex-col w-full max-w-[220px] sm:max-w-[280px] mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 h-auto sm:h-[400px] focus:outline-none animate-fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
      tabIndex={0}
    >
      {/* --------- бонус ---------- */}
      {bonus > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center px-2 py-1 bg-white rounded-full shadow text-[11px] font-semibold text-black border border-gray-100">
          +{bonus}₽
        </div>
      )}

      {/* --------- популярно ---------- */}
      {isPopular && (
        <div className="absolute top-2 right-2 z-20 bg-black text-white text-[10px] sm:text-sm px-2 py-0.5 rounded-full flex items-center font-bold">
          <Star size={isMobile ? 11 : 13} className="text-yellow-400 mr-1" />
          Популярно
        </div>
      )}

      {/* --------- изображение ---------- */}
      <Link
        href={`/product/${product.id}`}
        className="block relative w-full h-56 sm:h-64 rounded-t-lg overflow-hidden aspect-[3/4]"
        tabIndex={-1}
        aria-label={`Перейти к товару ${product.title}`}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
          sizes="(max-width: 640px) 100vw, 280px"
          loading="lazy"
        />
        {!isMobile && images.length > 1 && (
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-black' : 'bg-black/20'}`}
              />
            ))}
          </div>
        )}
      </Link>

      {/* --------- описание & цена ---------- */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 min-h-[140px] sm:min-h-[160px]">
        <h3
          id={`product-${product.id}-title`}
          className="text-sm sm:text-[15px] font-medium text-black text-center line-clamp-2 break-words"
        >
          {product.title}
        </h3>

        <div className="flex flex-col items-center mt-2 sm:mt-3">
          {discountAmount > 0 ? (
            <>
              <div className="flex items-center mb-1">
                <span className="text-xs sm:text-sm text-gray-400 line-through mr-1 sm:mr-2">
                  {(originalPrice > product.price ? originalPrice : product.price)}₽
                </span>
                <span className="bg-black text-white rounded-md px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold">
                  -{discountAmount}₽
                </span>
              </div>
              <span className="text-lg sm:text-2xl font-bold text-black">{discountedPrice}₽</span>
            </>
          ) : originalPrice > product.price ? (
            <>
              <span className="text-xs sm:text-sm text-gray-400 line-through">{originalPrice}₽</span>
              <span className="text-lg sm:text-2xl font-bold text-black">{product.price}₽</span>
            </>
          ) : (
            <span className="text-lg sm:text-2xl font-bold text-black">{product.price}₽</span>
          )}
        </div>

        {/* --------- кнопка ---------- */}
        <AnimatePresence>
          {(hovered || isMobile) && (
            <motion.button
              ref={buttonRef}
              onClick={handleAddToCart}
              className="mt-2 sm:mt-auto flex items-center justify-center gap-1.5 sm:gap-2 border border-gray-300 rounded-lg px-4 py-3 font-bold text-sm uppercase bg-white text-black transition-all duration-200 hover:bg-black hover:text-white active:scale-95 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
              aria-label={`Добавить ${product.title} в корзину`}
            >
              {isMobile ? <ShoppingCart size={16} /> : (
                <>
                  <ShoppingCart size={19} /> В корзину
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}