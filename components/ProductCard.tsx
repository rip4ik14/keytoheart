'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { Star, ShoppingCart } from 'lucide-react';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import type { Product } from '@/types/product';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface ProductCardProps {
  product: Product & {
    computedPrice?: number;
    discountAmount?: number;
  };
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export default function ProductCard({
  product,
  priority = false,
  loading,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { triggerCartAnimation } = useCartAnimation();

  const [hovered, setHovered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const images = Array.isArray(product.images) ? product.images : [];
  const imageUrl = images[0] || '/placeholder.jpg';
  const bonus = product.bonus ?? Math.floor(product.price * 0.025);
  const isPopular = product.is_popular;
  const computedPrice = product.computedPrice ?? product.price;
  const discountAmount = product.discountAmount ?? 0;

  const handleAddToCart = () => {
    addItem({
      id: product.id.toString(),
      title: product.title,
      price: computedPrice,
      quantity: 1,
      imageUrl,
      production_time: product.production_time ?? null,
    });

    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'add_to_cart');
    }

    if (buttonRef.current) {
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

  return (
    <div
      ref={cardRef}
      className="product-card relative flex flex-col w-full max-w-[220px] sm:max-w-[280px] mx-auto bg-white rounded-[18px] border border-gray-200 overflow-hidden shadow-sm transition-all duration-200 h-auto sm:h-[400px] focus:outline-none focus:ring-2 focus:ring-black animate-fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
      tabIndex={0}
    >
      {bonus > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center px-2 py-1 bg-white rounded-full shadow text-[12px] font-semibold text-black border border-gray-100">
          +{bonus}
          <Image
            src="/icons/gift.svg"
            alt="Бонусы"
            width={13}
            height={13}
            className="ml-1"
            loading="lazy"
          />
        </div>
      )}

      {isPopular && (
        <div className="absolute top-2 right-2 z-20 bg-black text-white text-[12px] px-2 py-0.5 rounded-full flex items-center font-bold">
          <Star size={13} className="text-yellow-400 mr-1" />
          Популярно
        </div>
      )}

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
          className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
          sizes="(max-width: 640px) 100vw, 280px"
          loading={loading}
          priority={priority}
        />
        {images.length > 1 && (
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex gap-1 z-10 hidden sm:flex">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-black' : 'bg-black/20'}`}
              />
            ))}
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-2 sm:p-4 min-h-[110px] sm:min-h-[150px]">
        <h3
          id={`product-${product.id}-title`}
          className="text-center line-clamp-2 mb-2"
          style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontFamily: 'var(--font-golos)' }}
        >
          {product.title}
        </h3>

        <div className="flex items-center justify-center gap-2 mb-1 min-h-[30px]">
          {discountAmount > 0 && (
            <>
              <span
                className="text-[12px] text-gray-400 line-through"
                style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}
              >
                {product.price}₽
              </span>
              <span className="bg-black text-white rounded px-1.5 py-0.5 text-[12px] font-bold">
                -{discountAmount}₽
              </span>
            </>
          )}
          <span
            className="text-lg font-bold text-black"
            style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}
          >
            {computedPrice}₽
          </span>
        </div>

        {product.production_time != null && (
          <p
            className="text-center text-[12px] text-gray-500"
            style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}
          >
            Время изготовления: {product.production_time}{' '}
            {product.production_time === 1 ? 'час' : 'часов'}
          </p>
        )}

        <AnimatePresence>
          {hovered && (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.22 }}
              className="w-full sm:absolute sm:left-0 sm:bottom-0 sm:bg-transparent"
              style={{ zIndex: 10 }}
            >
              <button
                ref={buttonRef}
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center bg-white border border-gray-300 text-black py-2 sm:py-3 rounded-lg sm:rounded-b-[18px] sm:border-b-0 font-bold transition-all duration-200 hover:bg-black hover:text-white active:scale-95 focus:outline-none focus:ring-2 focus:ring-black"
                aria-label={`Добавить ${product.title} в корзину`}
                style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}
              >
                <ShoppingCart size={20} className="mr-2" />
                <span className="uppercase tracking-wider">В корзину</span>
              </button>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}