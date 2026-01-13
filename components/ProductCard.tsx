// ✅ Путь: components/ProductCard.tsx
'use client';

import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Gift } from 'lucide-react';
import { trackAddToCart } from '@/utils/ymEvents';
import type { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';

function normalizeTitle(raw: string): string {
  const t = (raw || '').trim();
  if (t.length < 20) return t;

  const match = t.match(/^(.+)\1$/);
  if (match && match[1].trim().length > 10) return match[1].trim();

  return t;
}

function formatRuble(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n);
}

function declineWord(num: number, words: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[num % 100 > 4 && num % 100 < 20 ? 2 : cases[num % 10 < 5 ? num % 10 : 5]];
}

function formatProductionTime(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  let result = '';
  if (hours > 0) result += `${hours} ${declineWord(hours, ['час', 'часа', 'часов'])}`;
  if (mins > 0) result += (result ? ' ' : '') + `${mins} ${declineWord(mins, ['минута', 'минуты', 'минут'])}`;
  return result || 'Мгновенно';
}

export default function ProductCard({
  product,
  priority = false,
  shadowMode = 'default',
}: {
  product: Product;
  priority?: boolean;
  shadowMode?: 'default' | 'none';
}) {
  const { addItem } = useCart();
  const { triggerCartAnimation } = useCartAnimation();

  const [isMobile, setIsMobile] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const stablePriority = useRef(priority).current;

  const title = useMemo(() => normalizeTitle(product.title || ''), [product.title]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const images = Array.isArray(product.images) ? product.images : [];
  const imageUrl = images[0] || '/placeholder.jpg';

  const discountPercent = product.discount_percent ?? 0;
  const originalPrice = product.original_price || product.price;
  const discountedPrice = discountPercent ? Math.round(product.price * (1 - discountPercent / 100)) : product.price;

  const baseForDiscount = originalPrice > product.price ? originalPrice : product.price;
  const discountAmount = discountPercent ? Math.max(0, baseForDiscount - discountedPrice) : 0;

  const bonus = product.bonus ?? Math.floor(discountedPrice * 0.025);
  const isPopular = !!product.is_popular;

  const productionText = useMemo(
    () => formatProductionTime(product.production_time ?? null),
    [product.production_time],
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleAddToCart = () => {
    addItem({
      id: product.id.toString(),
      title,
      price: discountedPrice,
      quantity: 1,
      imageUrl,
      production_time: product.production_time ?? null,
    });

    trackAddToCart({
      id: product.id,
      name: title,
      price: discountedPrice,
      quantity: 1,
    });

    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      triggerCartAnimation(r.left + r.width / 2, r.top + r.height / 2, imageUrl);
    }

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 2800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddToCart();
    }
  };

  const priceText = useMemo(() => `${formatRuble(discountedPrice)} ₽`, [discountedPrice]);

  if (isMobile) {
    const cardBorderClass = 'border-gray-200 shadow-sm';

    return (
      <>
        <motion.div
          ref={cardRef}
          className={[
            'relative w-full max-w-[220px] mx-auto bg-white rounded-[18px]',
            'flex flex-col h-full',
            'transition-all duration-200 focus:outline-none overflow-hidden border',
            cardBorderClass,
          ].join(' ')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onKeyDown={handleKeyDown}
          role="article"
          aria-labelledby={`product-${product.id}-title`}
          tabIndex={0}
          aria-live="polite"
        >
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org/',
                '@type': 'Product',
                name: title,
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
                  availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                  itemCondition: 'https://schema.org/NewCondition',
                },
              }),
            }}
          />

          <div className="absolute top-2 right-2 z-20 pointer-events-none">
            <div className="flex flex-col items-end gap-2">
              {isPopular && (
                <motion.div
                  className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full flex items-center font-bold shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Star size={16} className="text-yellow-400 mr-1" />
                  Популярно
                </motion.div>
              )}

              {bonus > 0 && (
                <motion.div
                  className="flex items-center px-2 py-1 bg-white rounded-full shadow text-[11px] font-semibold text-black border border-gray-100"
                  style={{ transform: 'translateX(-10px)' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  +{bonus}
                  <Image src="/icons/gift.svg" alt="" width={13} height={13} className="ml-1" draggable={false} />
                </motion.div>
              )}
            </div>
          </div>

          <Link
            href={`/product/${product.id}`}
            className="block relative w-full aspect-[3/4] transition-all duration-200 rounded-[18px] overflow-hidden"
            tabIndex={-1}
            aria-label={`Перейти к товару ${title}`}
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              fetchPriority={stablePriority ? 'high' : 'auto'}
              sizes="(max-width: 640px) 100vw, 220px"
              className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
              loading={stablePriority ? 'eager' : 'lazy'}
              priority={stablePriority}
            />
          </Link>

          <div className="flex flex-col p-2 flex-1">
            <h3
              id={`product-${product.id}-title`}
              className="text-sm font-medium text-black text-center leading-tight break-words"
              title={title}
            >
              {title}
            </h3>

            <div className="mt-2 flex flex-col items-center">
              <div className="flex items-center justify-center gap-2">
                {(discountAmount > 0 || originalPrice > product.price) && (
                  <span className="text-xs text-gray-400 line-through">{formatRuble(baseForDiscount)}₽</span>
                )}
                {discountAmount > 0 && (
                  <span className="text-[11px] font-bold text-red-500">-{formatRuble(discountAmount)}₽</span>
                )}
                <span className="text-lg font-bold text-black">
                  {discountAmount > 0 ? formatRuble(discountedPrice) : formatRuble(product.price)}₽
                </span>
              </div>

              {product.production_time != null && (
                <p className="mt-1 text-center text-xs text-gray-500 leading-snug whitespace-normal break-words">
                  Изготовление: {productionText || 'Не указано'}
                </p>
              )}
            </div>

            <button
              ref={buttonRef}
              onClick={handleAddToCart}
              className={[
                'mt-auto w-full',
                'inline-flex items-center justify-center gap-2',
                'h-[44px] px-4 rounded-full',
                'bg-black text-white',
                'text-[12px] font-bold uppercase tracking-tight',
                'shadow-[0_10px_24px_rgba(0,0,0,0.18)]',
                'active:scale-[0.98] transition',
              ].join(' ')}
              aria-label={`Добавить ${title} в корзину`}
            >
              <ShoppingCart size={18} />
              В корзину
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showToast && (
            <motion.div
              className={[
                'fixed bottom-4 right-4 z-[9999]',
                'max-w-[380px] w-[92%]',
                'bg-white text-black rounded-2xl',
                'shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
                'border border-[#ededed]',
                'px-3 py-3 flex items-center gap-3',
              ].join(' ')}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <Image src={imageUrl} alt={title} width={48} height={48} className="object-cover w-full h-full" />
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-sm font-semibold">Добавлено в корзину</p>
                <p className="text-xs text-gray-600 break-words">{title}</p>
              </div>

              <a
                href="/cart"
                className={[
                  'px-3 py-1.5 rounded-xl',
                  'bg-black text-white text-xs font-semibold',
                  'uppercase tracking-tight',
                  'hover:bg-gray-800 transition',
                  'flex-shrink-0',
                ].join(' ')}
              >
                В корзину
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  const useInternalShadow = shadowMode !== 'none';

  return (
    <>
      <motion.div
        className={[
          'group relative w-full',
          'max-w-[220px] sm:max-w-[280px] mx-auto',
          'rounded-[24px] bg-white',
          'border border-[#ececec]',
          'overflow-hidden',
          'transition-transform duration-300',
          'hover:scale-[1.01]', // эффект, без "реального" увеличения высоты в потоке
          useInternalShadow
            ? 'shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:shadow-[0_18px_44px_rgba(0,0,0,0.12)]'
            : 'shadow-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20',
        ].join(' ')}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        onKeyDown={handleKeyDown}
        role="article"
        aria-labelledby={`product-${product.id}-title`}
        tabIndex={0}
        aria-live="polite"
      >
        <div className="relative p-3 sm:p-4">
          <Link
            href={`/product/${product.id}`}
            className="block relative w-full aspect-[3/4] rounded-[18px] overflow-hidden bg-[#f6f6f6]"
            tabIndex={-1}
            aria-label={`Перейти к товару ${title}`}
          >
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/35 via-transparent to-black/10 opacity-80" />

            <Image
              src={imageUrl}
              alt={title}
              fill
              fetchPriority={stablePriority ? 'high' : 'auto'}
              sizes="(max-width: 640px) 50vw, 280px"
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
              loading={stablePriority ? 'eager' : 'lazy'}
              priority={stablePriority}
            />

            <div className="absolute left-3 top-3 z-[2] flex flex-col gap-2">
              {bonus > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 border border-[#ededed] shadow-sm">
                  <Gift size={14} className="text-[#4b4b4b]" />
                  <span className="text-[11px] font-semibold tracking-tight text-[#4b4b4b]">+{bonus}</span>
                </div>
              )}

              {productionText && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 border border-[#ededed] shadow-sm">
                  <span className="text-[11px] font-semibold tracking-tight text-[#4b4b4b]">{productionText}</span>
                </div>
              )}
            </div>

            <div className="absolute right-3 top-3 z-[2] flex flex-col items-end gap-2">
              {isPopular && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-black/90 text-white px-3 py-1.5 shadow-sm">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-[11px] font-bold uppercase tracking-tight">Популярно</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="inline-flex items-center rounded-full bg-white/90 backdrop-blur px-3 py-1.5 border border-[#ededed] shadow-sm">
                  <span className="text-[11px] font-bold tracking-tight text-black">
                    -{formatRuble(discountAmount)} ₽
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <h3
            id={`product-${product.id}-title`}
            className="text-[13px] sm:text-[14px] font-semibold leading-[1.25] text-black break-words"
            title={title}
          >
            {title}
          </h3>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] sm:text-[16px] font-bold tracking-tight text-black">{priceText}</span>
                {(discountAmount > 0 || originalPrice > product.price) && (
                  <span className="text-[12px] text-[#9a9a9a] line-through">{formatRuble(baseForDiscount)} ₽</span>
                )}
              </div>

              {productionText && (
                <div className="mt-1 text-[11px] text-[#8b8b8b] leading-snug break-words">
                  Изготовление: {productionText}
                </div>
              )}
            </div>

            <div className="shrink-0 w-[132px] h-[44px] flex items-end justify-end">
              <button
                ref={buttonRef}
                type="button"
                onClick={handleAddToCart}
                className={[
                  'inline-flex items-center justify-center gap-2',
                  'h-[44px] px-4 rounded-full',
                  'border border-[#bdbdbd]',
                  'bg-white text-black',
                  'text-[12px] font-bold uppercase tracking-tight',
                  'shadow-[0_1px_0_rgba(0,0,0,0.05)]',
                  'transition-all duration-200',
                  'hover:bg-black hover:text-white hover:border-black',
                  'active:scale-[0.98]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30',
                  'opacity-0 translate-y-2 pointer-events-none',
                  'group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto',
                ].join(' ')}
                aria-label={`Добавить ${title} в корзину`}
              >
                <ShoppingCart size={18} />
                В корзину
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            className={[
              'fixed bottom-4 right-4 z-[9999]',
              'max-w-[380px] w-[92%] sm:w-[340px]',
              'bg-white text-black rounded-2xl',
              'shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
              'border border-[#ededed]',
              'px-3 py-3 flex items-center gap-3',
            ].join(' ')}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              <Image src={imageUrl} alt={title} width={48} height={48} className="object-cover w-full h-full" />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-sm font-semibold">Добавлено в корзину</p>
              <p className="text-xs text-gray-600 break-words">{title}</p>
            </div>

            <a
              href="/cart"
              className={[
                'px-3 py-1.5 rounded-xl',
                'bg-black text-white text-xs font-semibold',
                'uppercase tracking-tight',
                'hover:bg-gray-800 transition',
                'flex-shrink-0',
              ].join(' ')}
            >
              В корзину
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
