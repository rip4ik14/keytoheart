'use client';

/* -------------------------------------------------------------------------- */
/*  Карточка товара: next/image для иконки, aria-live, fetchPriority          */
/* -------------------------------------------------------------------------- */
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Star, ShoppingCart } from 'lucide-react';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import type { Product } from '@/types/product';

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

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* ------------------------- mobile / resize ------------------------- */
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
  const discountAmount =
    discountPercent
      ? (originalPrice > product.price ? originalPrice : product.price) - discountedPrice
      : 0;
  const isPopular = product.is_popular;

  /* --------------------------- add to cart --------------------------- */
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

    /* анимация полёта в корзину */
    if (isMobile && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      triggerCartAnimation(r.left + r.width / 2, r.top + r.height / 2, imageUrl);
    }

    toast.success('Товар добавлен в корзину', { id: `add-${product.id}` }); // CHANGED: dedup id
  };

  /* enter/space → в корзину */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddToCart();
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative flex flex-col w-full max-w-[220px] sm:max-w-[280px] mx-auto bg-white rounded-[18px] border border-gray-200 overflow-hidden shadow-sm transition-all duration-200 h-auto sm:h-[400px] focus:outline-none animate-fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
      tabIndex={0}
      aria-live="polite"                       /* NEW: screen-reader об изменении содержимого */
    >
      {/* ----------- бонусы ----------- */}
      {bonus > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center px-2 py-1 bg-white rounded-full shadow text-[11px] font-semibold text-black border border-gray-100">
          +{bonus}
          <Image              /* CHANGED: next/image вместо <img> */
            src="/icons/gift.svg"
            alt=""
            width={13}
            height={13}
            className="ml-1"
            draggable={false}
          />
        </div>
      )}

      {/* ----------- популярное ----------- */}
      {isPopular && (
        <div className="absolute top-2 right-2 z-20 bg-black text-white text-[10px] sm:text-sm px-2 py-0.5 rounded-full flex items-center font-bold">
          <Star size={isMobile ? 11 : 13} className="text-yellow-400 mr-1" />
          Популярно
        </div>
      )}

      {/* ----------- изображение товара ----------- */}
      <Link
        href={`/product/${product.id}`}
        className="block relative w-full h-56 sm:h-64 rounded-t-[16px] overflow-hidden aspect-[3/4]"
        tabIndex={-1}
        aria-label={`Перейти к товару ${product.title}`}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          fetchPriority={priority ? 'high' : 'auto'}   /* NEW */
          sizes="(max-width: 640px) 100vw, 280px"
          className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
        />

        {!isMobile && images.length > 1 && (
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === 0 ? 'bg-black' : 'bg-black/20'
                }`}
              />
            ))}
          </div>
        )}
      </Link>

      {/* ----------- контент / кнопка ----------- */}
      <div className="flex flex-col flex-1 p-2 sm:p-4 min-h-[110px] sm:min-h-[150px]">
        <h3
          id={`product-${product.id}-title`}
          className="text-sm sm:text-[15px] font-medium text-black text-center line-clamp-2 mb-2"
        >
          {product.title}
        </h3>

        <div className="flex items-center justify-center gap-2 mb-1 min-h-[30px]">
          {(discountAmount > 0 || originalPrice > product.price) && (
            <span className="text-xs text-gray-400 line-through">
              {originalPrice > product.price ? originalPrice : product.price}₽
            </span>
          )}
          {discountAmount > 0 && (
            <span className="bg-black text-white rounded px-1.5 py-0.5 text-[11px] font-bold">
              -{discountAmount}₽
            </span>
          )}
          <span className="text-lg font-bold text-black">
            {discountAmount > 0 ? discountedPrice : product.price}₽
          </span>
        </div>

        {product.production_time != null && (
          <p className="text-center text-xs sm:text-sm text-gray-500">
            Время изготовления: {product.production_time}{' '}
            {product.production_time === 1 ? 'час' : 'часов'}
          </p>
        )}

        <AnimatePresence>
          {(hovered || isMobile) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.22 }}
              className={`w-full ${
                isMobile
                  ? 'mt-3'
                  : 'absolute left-0 bottom-0 w-full bg-transparent'
              }`}
              style={{ zIndex: 10 }}
            >
              <button
                ref={buttonRef}
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center ${
                  isMobile
                    ? 'bg-white border border-gray-300 text-black py-2 rounded-lg font-bold text-base'
                    : 'bg-white border-t border-x border-b-0 border-gray-300 text-black py-3 rounded-b-[18px] font-bold shadow-md'
                } transition-all duration-200 hover:bg-black hover:text-white active:scale-95`}
                aria-label={`Добавить ${product.title} в корзину`}
              >
                <ShoppingCart size={20} aria-hidden="true" className="mr-2" />
                <span className="uppercase tracking-wider">В корзину</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
