// ✅ Путь: components/ProductCard.tsx
'use client';

import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Gift, Clock } from 'lucide-react';
import { trackAddToCart } from '@/utils/ymEvents';
import type { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';

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

// ✅ компактно для бейджа: 1 ч 20 м
function formatProductionCompact(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0 && m > 0) return `${h} ч ${m} м`;
  if (h > 0) return `${h} ч`;
  return `${m} м`;
}

// CSS var from StickyHeader.tsx
const STICKY_HEADER_VAR = '--kth-sticky-header-h';

function isRemoteUrl(src: string) {
  return /^https?:\/\//i.test(src);
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

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 640px)').matches;
  });

  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ фиксируем, какая версия тоста должна показываться (моб/десктоп) в момент клика
  const toastPlacementRef = useRef<'mobile' | 'desktop'>('desktop');

  // ✅ фиксируем top тоста при показе (на iOS это сильно снижает мерцание при скролле)
  const toastTopRef = useRef<string | null>(null);

  // ✅ для portal
  const [mounted, setMounted] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const stablePriority = useRef(priority).current;

  const title = useMemo(() => normalizeTitle(product.title || ''), [product.title]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsMobile(mq.matches);

    onChange();

    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
    else mq.addListener(onChange);

    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
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

  const productionCompact = useMemo(
    () => formatProductionCompact(product.production_time ?? null),
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

    toastPlacementRef.current = isMobile ? 'mobile' : 'desktop';

    // ✅ фиксируем top один раз, чтобы при скролле iOS не пересчитывал позицию fixed + blur
    if (typeof window !== 'undefined') {
      if (isMobile) {
        const headerH =
          getComputedStyle(document.documentElement).getPropertyValue(STICKY_HEADER_VAR).trim() || '72px';

        const safeTop = 'max(env(safe-area-inset-top), 12px)';
        toastTopRef.current = `calc(${headerH} + 12px + ${safeTop})`;
      } else {
        toastTopRef.current = null;
      }
    }

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 2400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddToCart();
    }
  };

  const priceText = useMemo(() => `${formatRuble(discountedPrice)} ₽`, [discountedPrice]);

  // ✅ Mobile toast: без AnimatePresence, без mount/unmount -> меньше артефактов
  const MobileToast = () => {
    if (!mounted) return null;

    const unoptThumb = isRemoteUrl(imageUrl);

    return createPortal(
      <motion.div
        className={[
          'fixed z-[2147483647]',
          'bg-white/78 backdrop-blur-xl',
          'text-black rounded-2xl',
          'shadow-[0_18px_60px_rgba(0,0,0,0.18)]',
          'border border-black/10',
          'px-3 py-3 flex items-center gap-3',
        ].join(' ')}
        style={{
          left: `calc(12px + env(safe-area-inset-left))`,
          right: `calc(12px + env(safe-area-inset-right))`,
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
          top:
            toastTopRef.current ??
            `calc(var(${STICKY_HEADER_VAR}, 72px) + 12px + max(env(safe-area-inset-top), 12px))`,
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
          WebkitBackfaceVisibility: 'hidden',
        }}
        initial={false}
        animate={
          showToast && toastPlacementRef.current === 'mobile'
            ? { opacity: 1, y: 0, scale: 1, pointerEvents: 'auto' }
            : { opacity: 0, y: 8, scale: 0.98, pointerEvents: 'none' }
        }
        transition={{ duration: 0.18, ease: 'easeOut' }}
        aria-live="polite"
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/[0.04] flex-shrink-0 border border-black/10">
          <Image
            src={imageUrl}
            alt={title}
            width={48}
            height={48}
            className="object-cover w-full h-full"
            unoptimized={unoptThumb}
          />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-sm font-semibold">добавлено в корзину</p>
          <p className="text-xs text-black/60 break-words">{title}</p>
        </div>
      </motion.div>,
      document.body,
    );
  };

  if (isMobile) {
    const unopt = isRemoteUrl(imageUrl);

    return (
      <>
        <motion.div
          ref={cardRef}
          className={[
            'relative w-full',
            'rounded-[18px]',
            'border border-black/10',
            'bg-white',
            'shadow-[0_10px_28px_rgba(0,0,0,0.06)]',
            'overflow-hidden',
            'flex flex-col',
          ].join(' ')}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          onKeyDown={handleKeyDown}
          role="article"
          aria-labelledby={`product-${product.id}-title`}
          tabIndex={0}
        >
          {/* schema.org оставляем как было в твоем первом файле */}
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
                brand: { '@type': 'Brand', name: 'KeyToHeart' },
                offers: {
                  '@type': 'Offer',
                  url: `/product/${product.id}`,
                  priceCurrency: 'RUB',
                  price: discountedPrice.toString(),
                  priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                  itemCondition: 'https://schema.org/NewCondition',
                },
              }),
            }}
          />

          <Link
            href={`/product/${product.id}`}
            className="block relative w-full aspect-[1/1] overflow-hidden bg-black/[0.04]"
            tabIndex={-1}
            aria-label={`Перейти к товару ${title}`}
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              fetchPriority={stablePriority ? 'high' : 'auto'}
              sizes="(max-width: 640px) 70vw, 220px"
              className="object-cover w-full h-full"
              loading={stablePriority ? 'eager' : 'lazy'}
              priority={stablePriority}
              unoptimized={unopt}
            />

            {/* ✅ нижний скрим - читаемость на любых фото */}
            <div className="absolute inset-x-0 bottom-0 h-[72px] z-[10] pointer-events-none bg-gradient-to-t from-black/45 via-black/15 to-transparent" />

            {/* ✅ бонус (компактный) */}
            <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
              {bonus > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 border border-black/10 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                  <Gift size={12} className="text-black/70" />
                  <span className="text-[10px] font-semibold text-black/80">+{bonus}</span>
                </div>
              )}
            </div>

            {/* ✅ популярно - только звезда */}
            <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
              {isPopular && (
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/75 border border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                  <Star size={14} className="text-yellow-400" />
                </div>
              )}
            </div>

            {/* ✅ время изготовления - контрастная плашка */}
            <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 border border-white/10 shadow-[0_10px_26px_rgba(0,0,0,0.18)] backdrop-blur-[6px]">
                <Clock size={12} className="text-white/80" />
                <span className="text-[10px] font-semibold text-white">
                  {productionCompact || (productionText ? productionText : '-')}
                </span>
              </div>
            </div>

            {/* ✅ скидка - снизу справа (если есть) */}
            {discountAmount > 0 && (
              <div className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none">
                <div className="inline-flex items-center rounded-full bg-black/70 px-2.5 py-1 border border-white/10 shadow-[0_10px_26px_rgba(0,0,0,0.18)] backdrop-blur-[6px]">
                  <span className="text-[10px] font-bold text-white">-{formatRuble(discountAmount)} ₽</span>
                </div>
              </div>
            )}
          </Link>

          {/* ✅ низ карточки - название 2 строки + кнопка-цена */}
          <div className="px-3 pt-3 pb-3">
            <h3
              id={`product-${product.id}-title`}
              className="text-[13px] font-medium text-black leading-[1.25] break-words"
              title={title}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </h3>

            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                {(discountAmount > 0 || originalPrice > product.price) && (
                  <div className="text-[12px] text-black/45 line-through">{formatRuble(baseForDiscount)} ₽</div>
                )}
              </div>

              <button
                ref={buttonRef}
                type="button"
                onClick={handleAddToCart}
                className={[
                  'shrink-0',
                  'inline-flex items-center justify-center gap-2',
                  'h-[36px] px-3 rounded-[14px]',
                  'bg-black/[0.04]',
                  'border border-black/10',
                  'text-black',
                  'shadow-[0_10px_20px_rgba(0,0,0,0.06)]',
                  'active:scale-[0.99]',
                  'transition',
                ].join(' ')}
                aria-label={`Добавить ${title} в корзину`}
              >
                <ShoppingCart size={16} className="text-black/70" />
                <span className="text-[14px] font-bold">{priceText}</span>
              </button>
            </div>
          </div>
        </motion.div>

        <MobileToast />
      </>
    );
  }

  // =========================
  // ✅ DESKTOP - ВОЗВРАЩЕНО 1:1 КАК У ТЕБЯ (НЕ ТРОГАЕМ)
  // =========================
  const useInternalShadow = shadowMode !== 'none';
  const DESKTOP_TITLE_H = 'h-[50px]';
  const DESKTOP_META_H = 'h-[36px]';
  const DESKTOP_BOTTOM_H = 'h-[104px]';

  return (
    <>
      <motion.div
        className={[
          'group relative w-full',
          'max-w-[220px] sm:max-w-[280px] mx-auto',
          'rounded-[26px]',
          'bg-white/70 backdrop-blur-xl',
          'border border-black/10',
          'overflow-hidden',
          'transition-transform duration-300',
          'hover:scale-[1.01]',
          useInternalShadow
            ? 'shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:shadow-[0_22px_70px_rgba(0,0,0,0.14)]'
            : 'shadow-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-black/15',
          'flex flex-col',
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
            className="block relative w-full aspect-[3/4] rounded-[18px] overflow-hidden bg-black/[0.04] border border-black/10"
            tabIndex={-1}
            aria-label={`Перейти к товару ${title}`}
          >
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/30 via-transparent to-black/10" />

            <Image
              src={imageUrl}
              alt={title}
              fill
              fetchPriority={stablePriority ? 'high' : 'auto'}
              sizes="(max-width: 640px) 50vw, 280px"
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
              loading={stablePriority ? 'eager' : 'lazy'}
              priority={stablePriority}
              unoptimized={isRemoteUrl(imageUrl)}
            />

            <div className="absolute left-3 top-3 z-[2] flex flex-col gap-2">
              {bonus > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/75 backdrop-blur px-3 py-1.5 border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
                  <Gift size={14} className="text-black/70" />
                  <span className="text-[11px] font-semibold tracking-tight text-black/80">+{bonus}</span>
                </div>
              )}

              {productionText && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/75 backdrop-blur px-3 py-1.5 border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
                  <Clock size={14} className="text-black/55" />
                  <span className="text-[11px] font-semibold tracking-tight text-black/70">{productionText}</span>
                </div>
              )}
            </div>

            <div className="absolute right-3 top-3 z-[2] flex flex-col items-end gap-2">
              {isPopular && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-black/70 text-white px-3 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-white/10 backdrop-blur">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-[11px] font-bold uppercase tracking-tight">популярно</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="inline-flex items-center rounded-full bg-white/75 backdrop-blur px-3 py-1.5 border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
                  <span className="text-[11px] font-bold tracking-tight text-black">-{formatRuble(discountAmount)} ₽</span>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex flex-col flex-1">
          <div className={[DESKTOP_TITLE_H, 'flex items-start'].join(' ')}>
            <h3
              id={`product-${product.id}-title`}
              className="text-[13px] sm:text-[14px] font-semibold leading-tight text-black break-words"
              title={title}
            >
              {title}
            </h3>
          </div>

          <div className={[DESKTOP_BOTTOM_H, 'mt-auto flex flex-col justify-end'].join(' ')}>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] sm:text-[16px] font-bold tracking-tight text-black">{priceText}</span>

                  {(discountAmount > 0 || originalPrice > product.price) && (
                    <span className="text-[12px] text-black/45 line-through">{formatRuble(baseForDiscount)} ₽</span>
                  )}
                </div>

                <div className={[DESKTOP_META_H, 'mt-1'].join(' ')}>
                  {productionText ? (
                    <div className="text-[11px] text-black/55 leading-snug break-words">Изготовление: {productionText}</div>
                  ) : (
                    <span className="text-[11px] text-transparent select-none">.</span>
                  )}
                </div>
              </div>

              <div className="shrink-0 w-[132px] h-[44px] flex items-end justify-end">
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={handleAddToCart}
                  className={[
                    'inline-flex items-center justify-center gap-2',
                    'h-[44px] px-4 rounded-full',
                    'bg-white/70 backdrop-blur-xl',
                    'border border-black/15',
                    'text-black',
                    'text-[12px] font-bold uppercase tracking-tight',
                    'shadow-[0_14px_40px_rgba(0,0,0,0.10)]',
                    'transition-all duration-200',
                    'hover:bg-black hover:text-white hover:border-black',
                    'active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15',
                    'opacity-0 translate-y-2 pointer-events-none',
                    'group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto',
                  ].join(' ')}
                  aria-label={`Добавить ${title} в корзину`}
                >
                  <ShoppingCart size={18} />
                  в корзину
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ✅ desktop toast */}
      <AnimatePresence>
        {showToast && toastPlacementRef.current === 'desktop' && (
          <motion.div
            className={[
              'fixed bottom-4 right-4 z-[9999]',
              'max-w-[380px] w-[92%] sm:w-[340px]',
              'bg-white/78 backdrop-blur-xl text-black rounded-2xl',
              'shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
              'border border-black/10',
              'px-3 py-3 flex items-center gap-3',
            ].join(' ')}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            aria-live="polite"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/[0.04] flex-shrink-0 border border-black/10">
              <Image
                src={imageUrl}
                alt={title}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                unoptimized={isRemoteUrl(imageUrl)}
              />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-sm font-semibold">добавлено в корзину</p>
              <p className="text-xs text-black/60 break-words">{title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
