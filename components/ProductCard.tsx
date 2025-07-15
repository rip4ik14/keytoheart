'use client';

import { useState, useEffect, useRef } from 'react';
import Image          from 'next/image';
import Link           from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart }      from 'lucide-react';
import toast                       from 'react-hot-toast';

import { useCart }            from '@context/CartContext';
import { useCartAnimation }   from '@context/CartAnimationContext';
import { callYm }             from '@/utils/metrics';
import { YM_ID }              from '@/utils/ym';
import type { Product }       from '@/types/product';

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  const { addItem } = useCart();
  const { triggerCartAnimation } = useCartAnimation();

  const [hovered,   setHovered]   = useState(false);
  const [isMobile,  setIsMobile]  = useState(false);

  const cardRef   = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const images    = Array.isArray(product.images) ? product.images : [];
  const imageUrl  = images[0] ?? '/placeholder.jpg';

  const bonus            = product.bonus ?? Math.floor(product.price * 0.025);
  const discountPercent  = product.discount_percent ?? 0;
  const originalPrice    = product.original_price ?? product.price;

  const discountedPrice  =
    discountPercent > 0
      ? Math.round(product.price * (1 - discountPercent / 100))
      : product.price;

  const discountAmount   =
    discountPercent > 0
      ? (originalPrice > product.price ? originalPrice : product.price) - discountedPrice
      : 0;

  const isPopular = product.is_popular;

  const handleAddToCart = () => {
    addItem({
      id:        String(product.id),
      title:     product.title,
      price:     discountedPrice,
      quantity:  1,
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
      role="article"
      tabIndex={0}
      aria-live="polite"
      aria-labelledby={`product-${product.id}-title`}
      className={`relative mx-auto w-full max-w-[220px] sm:max-w-[280px] overflow-hidden rounded-[18px] bg-white transition-all duration-200 focus:outline-none animate-fade-up
        ${isMobile ? 'border border-gray-200' : hovered ? 'border border-gray-200 shadow-sm' : ''}`}
      style={{ minHeight: isMobile ? 370 : undefined }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      itemScope
      itemType="https://schema.org/Product"
    >
      <meta itemProp="name" content={product.title} />
      <meta itemProp="sku"  content={String(product.id)} />
      <link itemProp="image" href={imageUrl} />

      <div itemProp="offers" itemScope itemType="https://schema.org/Offer" className="hidden">
        <meta itemProp="priceCurrency" content="RUB" />
        <meta itemProp="price"         content={String(discountedPrice)} />
        <link itemProp="availability"  href={product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type':    'Product',
            name:  product.title,
            image: imageUrl,
            description: product.description || 'Описание товара отсутствует',
            sku:  String(product.id),
            mpn:  String(product.id),
            brand:{ '@type': 'Brand', name: 'KEY TO HEART' },
            offers:{
              '@type':'Offer',
              url:          `https://keytoheart.ru/product/${product.id}`,
              price:        discountedPrice,
              priceCurrency:'RUB',
              priceValidUntil: new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0],
              availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              itemCondition:'https://schema.org/NewCondition',
            },
          }),
        }}
      />

      {bonus > 0 && (
        <motion.div
          className="absolute top-2 left-2 z-20 flex items-center rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-black shadow border border-gray-100 sm:top-4 sm:left-4"
          initial={{ opacity:0, scale:0.8 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.2 }}
        >
          +{bonus}
          <Image src="/icons/gift.svg" alt="" width={13} height={13} className="ml-1" draggable={false}/>
        </motion.div>
      )}

      {isPopular && (
        <motion.div
          className="absolute top-2 right-2 z-20 flex items-center rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white sm:text-sm sm:top-4 sm:right-4"
          initial={{ opacity:0, scale:0.8 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.2 }}
        >
          <Star size={isMobile ? 16 : 13} className="mr-1 text-yellow-400" />
          Популярно
        </motion.div>
      )}

      <Link
        href={`/product/${product.id}`}
        aria-label={`Перейти к товару ${product.title}`}
        tabIndex={-1}
        className={`block relative aspect-[3/4] w-full overflow-hidden transition-all duration-200 ${hovered ? 'rounded-t-[18px]' : 'rounded-[18px]'}`}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width:640px) 100vw, 280px"
          className="object-cover transition-transform duration-200 hover:scale-105"
          placeholder="blur"
          blurDataURL="/placeholder-blur.png"
        />
      </Link>

      {/* ---------- контент ---------- */}
      <div className="flex flex-col p-2 sm:p-4" style={{ paddingBottom: isMobile ? '3rem' : '48px' }}>
        <h3
          id={`product-${product.id}-title`}
          className="mb-2 line-clamp-3 text-center text-sm font-medium leading-tight text-black sm:text-[15px]"
        >
          {product.title}
        </h3>

        <div className="flex min-h-[30px] items-center justify-center gap-2">
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

          <span className="text-lg font-bold text-black">{discountedPrice}₽</span>
        </div>

        {product.production_time != null && (
          <p className="text-xs text-gray-500 text-center">
            Время изготовления: {product.production_time}{' '}
            {product.production_time === 1 ? 'час' : 'часов'}
          </p>
        )}
      </div>

      {/* ---------- кнопка: моб ---------- */}
      {isMobile && (
        <motion.div
          className="w-full"
          style={{ position:'absolute', bottom:0, left:0, width:'100%', padding:'0 8px', zIndex:10 }}
          initial={{ opacity:0, scale:0.9 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.2 }}
        >
          <button
            ref={buttonRef}
            onClick={handleAddToCart}
            aria-label={`Добавить ${product.title} в корзину`}
            className="flex w-full items-center justify-center rounded-b-[18px] border border-gray-300 bg-white py-2 text-base font-bold text-black transition-all duration-200 hover:bg-black hover:text-white"
            style={{ height:'2.5rem' }}
          >
            <ShoppingCart size={20} className="mr-2" />
            <span className="tracking-wider uppercase">В корзину</span>
          </button>
        </motion.div>
      )}

      {/* ---------- кнопка: десктоп ---------- */}
      {!isMobile && (
        <div
          style={{ position:'absolute', bottom:0, left:0, width:'100%', padding:'0 2px', zIndex:10 }}
        >
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:20 }}
                transition={{ duration:0.3 }}
              >
                <button
                  ref={buttonRef}
                  onClick={handleAddToCart}
                  aria-label={`Добавить ${product.title} в корзину`}
                  className="flex w-full items-center justify-center rounded-b-[18px] border border-gray-300 bg-white py-2 text-base font-bold text-black transition-all duration-200 hover:bg-black hover:text-white"
                  style={{ height:'2.5rem' }}
                >
                  <ShoppingCart size={20} className="mr-2" />
                  <span className="tracking-wider uppercase">В корзину</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
