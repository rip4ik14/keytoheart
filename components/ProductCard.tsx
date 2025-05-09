'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@context/CartContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Product } from '@/types/product';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const imageUrl = product.images?.[0] || '/placeholder.jpg';
  const bonus = Math.floor(product.price * 0.025);

  const discountPercent = product.discount_percent ?? 0;
  const discountedPrice = discountPercent > 0 ? Math.round(product.price * (1 - discountPercent / 100)) : product.price;
  const originalPrice = product.original_price || product.price;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showButton = hovered || isMobile;

  // Анимации для кнопки
  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className="relative flex flex-col items-center w-full max-w-[250px] mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
    >
      <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
        {/* Бонус */}
        {bonus > 0 && (
          <div
            className="absolute top-2 left-2 bg-white text-xs font-semibold px-2 py-1 rounded-full shadow z-10"
            aria-hidden="true"
          >
            +{bonus} ₽
          </div>
        )}

        {/* Изображение */}
        <Link href={`/product/${product.id}`}>
          <div className="relative w-full h-64 bg-white">
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 25vw"
              loading="lazy"
            />
          </div>
        </Link>

        {/* Информация о товаре */}
        <div className="p-4 text-center">
          <h3
            id={`product-${product.id}-title`}
            className="text-base font-semibold text-black truncate"
          >
            {product.title}
          </h3>
          <div className="mt-1">
            {discountPercent > 0 ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <p className="text-black font-bold">{discountedPrice} ₽</p>
                  <p className="text-sm text-gray-500 line-through">{product.price} ₽</p>
                </div>
                {originalPrice > product.price && (
                  <p className="text-xs text-gray-400">{originalPrice} ₽</p>
                )}
              </div>
            ) : originalPrice > product.price ? (
              <div className="flex flex-col items-center">
                <p className="text-black font-bold">{product.price} ₽</p>
                <p className="text-xs text-gray-400">{originalPrice} ₽</p>
              </div>
            ) : (
              <p className="text-black font-bold">{product.price} ₽</p>
            )}
          </div>
        </div>
      </div>

      {/* Кнопка "В корзину" с анимацией */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            onClick={() => {
              addItem({
                id: product.id.toString(), // Преобразуем number в string
                title: product.title,
                price: discountedPrice,
                quantity: 1,
                imageUrl,
              });
              toast.success('Товар добавлен в корзину');
              window.gtag?.('event', 'add_to_cart', {
                event_category: 'product',
                product_id: product.id,
              });
              window.ym?.(12345678, 'reachGoal', 'add_to_cart', {
                product_id: product.id,
              });
            }}
            className="mt-2 bg-black text-white text-sm px-6 py-2 rounded-md shadow hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-black"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={buttonVariants}
            aria-label={`Добавить ${product.title} в корзину`}
          >
            В корзину
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}