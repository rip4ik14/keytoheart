'use client';

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

  const stablePriority = useRef(priority).current;

  // Mobile detection
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

  // Add to cart logic
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddToCart();
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={[
        'relative w-full max-w-[220px] sm:max-w-[280px] mx-auto bg-white rounded-[18px] overflow-hidden transition-all duration-200 focus:outline-none',
        isMobile ? 'border border-gray-200' : hovered ? 'border border-gray-200 shadow-sm' : '',
        'flex flex-col h-full'
      ].join(' ')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
      tabIndex={0}
      aria-live="polite"
      style={{ minHeight: isMobile ? 370 : undefined }}
    >
      {/* SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.title,
            image: imageUrl,
            description: product.description || 'Описание товара отсутствует',
            sku: product.id.toString(),
            mpn: product.id.toString(),
            brand: { '@type': 'Brand', name: 'Labberry' },
            offers: {
              '@type': 'Offer',
              url: `/product/${product.id}`,
              priceCurrency: 'RUB',
              price: discountedPrice.toString(),
              priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
              availability: product.in_stock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
            },
          }),
        }}
      />

      {/* Бонусы */}
      {bonus > 0 && (
        <motion.div
          className="absolute top-2 left-2 z-20 flex items-center px-2 py-1 bg-white rounded-full shadow text-[11px] font-semibold text-black border border-gray-100 sm:top-4 sm:left-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          +{bonus}
          <Image src="/icons/gift.svg" alt="" width={13} height={13} className="ml-1" draggable={false} />
        </motion.div>
      )}

      {/* Популярно */}
      {isPopular && (
        <motion.div
          className="absolute top-2 right-2 z-20 bg-black text-white text-[10px] sm:text-sm px-2 py-0.5 rounded-full flex items-center font-bold sm:top-4 sm:right-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Star size={isMobile ? 16 : 13} className="text-yellow-400 mr-1" />
          Популярно
        </motion.div>
      )}

      {/* Картинка */}
      <Link
        href={`/product/${product.id}`}
        className="block relative w-full overflow-hidden aspect-[3/4] transition-all duration-200 rounded-[18px]"
        tabIndex={-1}
        aria-label={`Перейти к товару ${product.title}`}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          fetchPriority={stablePriority ? 'high' : 'auto'}
          sizes="(max-width: 640px) 100vw, 280px"
          className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
          loading={stablePriority ? 'eager' : 'lazy'}
          priority={stablePriority}
        />
      </Link>

      {/* Контент */}
      <div className="flex flex-col p-2 sm:p-4 flex-1 pb-12 sm:pb-14 relative">
        <h3
          id={`product-${product.id}-title`}
          className="text-sm sm:text-[15px] font-medium text-black text-center mb-2 leading-tight break-words"
        >
          {product.title}
        </h3>
        <div className="flex items-center justify-center gap-2 min-h-[30px]">
          {(discountAmount > 0 || originalPrice > product.price) && (
            <span className="text-xs text-gray-400 line-through">
              {originalPrice > product.price ? originalPrice : product.price}₽
            </span>
          )}
          {discountAmount > 0 && (
            <span className={`${isMobile ? 'text-red-500' : 'bg-black text-white rounded px-1.5 py-0.5'} text-[11px] font-bold`}>
              -{discountAmount}₽
            </span>
          )}
          <span className="text-lg font-bold text-black">
            {discountAmount > 0 ? discountedPrice : product.price}₽
          </span>
        </div>
        {product.production_time != null && (
          <p className="text-center text-xs text-gray-500">
            Время изготовления: {product.production_time} {product.production_time === 1 ? 'час' : 'часов'}
          </p>
        )}
      </div>

      {/* Кнопка "В корзину" (моб/деск) */}
      <div className="absolute left-0 bottom-0 w-full px-2 sm:px-3 z-10">
<AnimatePresence>
  {(isMobile || hovered) && (
    <motion.button
      ref={buttonRef}
      onClick={handleAddToCart}
      className="w-full flex items-center justify-center bg-white border border-gray-300 text-black py-2 rounded-b-[18px] font-bold text-base hover:bg-black hover:text-white transition-all duration-200"
      style={{ height: '2.5rem' }}
      aria-label={`Добавить ${product.title} в корзину`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      tabIndex={0}
    >
      <ShoppingCart size={20} className="mr-2" />
      <span className="uppercase tracking-wider">В корзину</span>
    </motion.button>
  )}
</AnimatePresence>

      </div>
    </motion.div>
  );
}