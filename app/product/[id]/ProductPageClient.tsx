'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@context/CartContext';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import styles from './ProductPageClient.module.css';
import { Product } from '@/types/product';

export type ComboItem = {
  id: number;
  title: string;
  price: number;
  image: string;
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const notificationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function ProductPageClient({
  product,
  combos,
}: {
  product: Product;
  combos: ComboItem[];
}) {
  const { addItem } = useCart();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [bonusPercent, setBonusPercent] = useState<number>(0.025);

  console.log('ProductPageClient received props:', { product, combos });

  const levels = [
    { name: 'Бронзовый', percent: 0.025, threshold: 0 },
    { name: 'Серебряный', percent: 0.05, threshold: 10000 },
    { name: 'Золотой', percent: 0.075, threshold: 20000 },
    { name: 'Платиновый', percent: 0.1, threshold: 30000 },
    { name: 'Премиум', percent: 0.15, threshold: 50000 },
  ];

  useEffect(() => {
    try {
      window.gtag?.('event', 'view_item', {
        event_category: 'ecommerce',
        event_label: product.title,
        value: product.price,
      });
      window.ym?.(12345678, 'reachGoal', 'view_item', { product_id: product.id });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, [product.id, product.title, product.price]);

  const discountPercent = product.discount_percent ?? 0;
  const discountedPrice = discountPercent > 0 ? Math.round(product.price * (1 - discountPercent / 100)) : product.price;
  const bonus = (discountedPrice * bonusPercent).toFixed(2).replace('.', ',');

  const handleAdd = (id: number, title: string, price: number, img: string | null, productionTime: number | null) => {
    addItem({ id: `${id}`, title, price, quantity: 1, imageUrl: img || '', production_time: productionTime });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
    try {
      window.gtag?.('event', 'add_to_cart', {
        event_category: 'ecommerce',
        event_label: title,
        value: price,
      });
      window.ym?.(12345678, 'reachGoal', 'add_to_cart', { product_id: id });
    } catch (error) {
      console.error('Add to cart analytics error:', error);
    }
  };

  return (
    <section className="min-h-screen bg-white text-black" aria-label={`Товар ${product.title}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <AnimatePresence>
          {showNotification && (
            <motion.div
              className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50"
              variants={notificationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              Добавлено в корзину!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            aria-label="Галерея изображений товара"
          >
            <Swiper
              navigation={{
                prevEl: `.${styles.customSwiperButtonPrev}`,
                nextEl: `.${styles.customSwiperButtonNext}`,
              }}
              thumbs={thumbsSwiper ? { swiper: thumbsSwiper } : undefined}
              modules={[FreeMode, Navigation, Thumbs]}
              className={`${styles.customSwiper} rounded-lg overflow-hidden relative`}
              aria-label="Основной слайдер изображений"
            >
              {(product.images || []).map((src, i) => (
                <SwiperSlide key={i}>
                  <div className="relative aspect-[4/3] w-full bg-gray-100">
                    <Image
                      src={src}
                      alt={`${product.title} - фото ${i + 1}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
              <div className={styles.customSwiperButtonPrev}></div>
              <div className={styles.customSwiperButtonNext}></div>
            </Swiper>
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={8}
              slidesPerView={4}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[FreeMode, Navigation, Thumbs]}
              className="mt-3"
              aria-label="Миниатюры изображений"
            >
              {(product.images || []).map((src, i) => (
                <SwiperSlide key={i}>
                  <div className="relative aspect-[4/3] rounded overflow-hidden cursor-pointer shadow-sm">
                    <Image
                      src={src}
                      alt={`${product.title} - миниатюра ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      sizes="(max-width: 768px) 25vw, 10vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>

          <motion.div
            className="flex flex-col space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">
              {product.title}
            </h1>
            <div className="flex flex-col gap-1">
              {discountPercent > 0 && (
                <span className="text-lg font-bold text-black">
                  {discountPercent}% скидка
                </span>
              )}
              {discountPercent > 0 ? (
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-black">
                    {discountedPrice} ₽
                  </span>
                  <span className="text-2xl text-gray-500 line-through">
                    {product.price} ₽
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-black">
                  {product.price} ₽
                </span>
              )}
              {bonus > '0.00' && (
                <span className="text-base text-black font-medium">
                  +{bonus} ₽ бонус
                </span>
              )}
              {product.production_time != null && (
                <span className="text-base text-black font-medium">
                  Время изготовления: {product.production_time} {product.production_time === 1 ? 'час' : 'часов'}
                </span>
              )}
            </div>
            <motion.button
              onClick={() =>
                handleAdd(product.id, product.title, discountedPrice, product.images?.[0] || null, product.production_time ?? null) // Преобразуем undefined в null
              }
              className="w-full py-3 bg-black text-white rounded-lg text-base font-medium hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
              variants={buttonVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              aria-label="Добавить в корзину"
            >
              Добавить в корзину
            </motion.button>
            <p className="text-xs text-gray-500">
              Состав букета может быть незначительно изменён. При этом стилистика и цветовая гамма останутся неизменными.
            </p>
            <div className="space-y-6">
              {product.description && (
                <div>
                  <h2 className="font-bold text-xl text-black mb-3">
                    Описание товара:
                  </h2>
                  <p className="text-lg text-black leading-loose whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
              {product.composition && (
                <div>
                  <h2 className="font-bold text-xl text-black mb-3">
                    Состав:
                  </h2>
                  <p className="text-lg text-black leading-loose whitespace-pre-line">
                    {product.composition}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {combos.length > 0 && (
          <motion.section
            className="mt-8 pt-8 border-t border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            aria-label="Рекомендуемые товары"
          >
            <h2 className="text-2xl font-bold text-black mb-6 tracking-tight">
              Рекомендуемые товары
            </h2>
            <div className="block sm:hidden">
              <Swiper
                spaceBetween={12}
                slidesPerView={1.5}
                freeMode
                modules={[FreeMode]}
                className="pb-4"
                aria-label="Слайдер рекомендуемых товаров"
              >
                {combos.slice(0, 4).map((combo) => (
                  <SwiperSlide key={combo.id}>
                    <motion.div
                      className="flex flex-col items-center group rounded-lg shadow-sm overflow-hidden bg-white"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative w-full aspect-[4/3] bg-gray-100">
                        <Image
                          src={combo.image}
                          alt={combo.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                      <div className="p-3 w-full">
                        <p className="text-sm text-left">{combo.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-black">
                            {combo.price} ₽
                          </span>
                        </div>
                        <motion.button
                          onClick={() =>
                            handleAdd(combo.id, combo.title, combo.price, combo.image, null)
                          }
                          className="w-full mt-2 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
                          variants={buttonVariants}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          aria-label={`Добавить ${combo.title} в корзину`}
                        >
                          Добавить
                        </motion.button>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {combos.slice(0, 4).map((combo) => (
                <motion.div
                  key={combo.id}
                  className="flex flex-col items-center group rounded-lg shadow-sm overflow-hidden bg-white"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    <Image
                      src={combo.image}
                      alt={combo.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3 w-full">
                    <p className="text-sm sm:text-base text-left">{combo.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm sm:text-base font-bold text-black">
                        {combo.price} ₽
                      </span>
                    </div>
                    <motion.button
                      onClick={() =>
                        handleAdd(combo.id, combo.title, combo.price, combo.image, null)
                      }
                      className="w-full mt-2 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
                      variants={buttonVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      aria-label={`Добавить ${combo.title} в корзину`}
                    >
                      Добавить
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </section>
  );
}