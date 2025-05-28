'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@context/CartContext';
import { Share2, Star } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { Product } from '@/types/product';

// Тип для рекомендованных товаров
export type ComboItem = {
  id: number;
  title: string;
  price: number;
  image: string;
};

// Тип для настроек магазина
interface DaySchedule {
  start: string;
  end: string;
  enabled?: boolean;
}

interface StoreSettings {
  order_acceptance_enabled: boolean;
  order_acceptance_schedule: Record<string, DaySchedule>;
  store_hours: Record<string, DaySchedule>;
}

const transformSchedule = (schedule: any): Record<string, DaySchedule> => {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const result: Record<string, DaySchedule> = daysOfWeek.reduce(
    (acc, day) => {
      acc[day] = { start: '09:00', end: '18:00', enabled: true };
      return acc;
    },
    {} as Record<string, DaySchedule>
  );
  if (typeof schedule !== 'object' || schedule === null) return result;
  for (const [key, value] of Object.entries(schedule)) {
    if (daysOfWeek.includes(key) && typeof value === 'object' && value !== null) {
      const { start, end, enabled } = value as any;
      if (
        typeof start === 'string' &&
        typeof end === 'string' &&
        (enabled === undefined || typeof enabled === 'boolean')
      ) {
        result[key] = {
          start,
          end,
          enabled: enabled ?? true,
        };
      }
    }
  }
  return result;
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [bonusPercent] = useState<number>(0.025);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] = useState(true);
  const [earliestDelivery, setEarliestDelivery] = useState<string | null>(null);
  const mainSwiperRef = useRef<any>(null);

  // Загружаем настройки магазина
  useEffect(() => {
    const fetchStoreSettings = async () => {
      setIsStoreSettingsLoading(true);
      try {
        const res = await fetch('/api/store-settings');
        const json = await res.json();
        if (res.ok && json.success) {
          setStoreSettings({
            order_acceptance_enabled: json.data.order_acceptance_enabled ?? false,
            order_acceptance_schedule: transformSchedule(json.data.order_acceptance_schedule),
            store_hours: transformSchedule(json.data.store_hours),
          });
        }
      } catch (error) {
        console.error('Error fetching store settings:', error);
      } finally {
        setIsStoreSettingsLoading(false);
      }
    };
    fetchStoreSettings();
  }, []);

  // Вычисляем ближайшее возможное время доставки
  useEffect(() => {
    if (!storeSettings || isStoreSettingsLoading || !product.production_time) {
      setEarliestDelivery(null);
      return;
    }

    if (!storeSettings.order_acceptance_enabled) {
      setEarliestDelivery('Магазин временно не принимает заказы.');
      return;
    }

    const now = new Date();
    const productionTime = product.production_time ?? 0;
    now.setHours(now.getHours() + productionTime);

    let earliestDate = now;
    let attempts = 0;
    const maxAttempts = 7; // Проверяем максимум 7 дней вперёд

    while (attempts < maxAttempts) {
      const dayKey = earliestDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      const orderSchedule = storeSettings.order_acceptance_schedule[dayKey];
      const storeSchedule = storeSettings.store_hours[dayKey];

      // Проверяем, работает ли магазин в этот день
      if (
        orderSchedule?.enabled !== false &&
        storeSchedule?.enabled !== false &&
        orderSchedule?.start &&
        orderSchedule?.end &&
        storeSchedule?.start &&
        storeSchedule?.end
      ) {
        const earliestStart = orderSchedule.start > storeSchedule.start ? orderSchedule.start : storeSchedule.start;
        const latestEnd = orderSchedule.end < storeSchedule.end ? orderSchedule.end : storeSchedule.end;

        const [startH, startM] = earliestStart.split(':').map(Number);
        const earliestTime = new Date(earliestDate);
        earliestTime.setHours(startH, startM, 0, 0);

        if (earliestDate < earliestTime) {
          earliestDate = earliestTime;
        }

        const [endH, endM] = latestEnd.split(':').map(Number);
        const latestTime = new Date(earliestDate);
        latestTime.setHours(endH, endM, 0, 0);

        if (earliestDate <= latestTime) {
          // Найдено подходящее время
          const formattedDate = earliestDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          const formattedTime = `${String(earliestDate.getHours()).padStart(2, '0')}:${String(
            earliestDate.getMinutes()
          ).padStart(2, '0')}`;
          setEarliestDelivery(`Самое раннее время доставки: ${formattedDate} в ${formattedTime}`);
          return;
        }
      }

      // Если день не подходит, переходим к следующему
      earliestDate = new Date(earliestDate);
      earliestDate.setDate(earliestDate.getDate() + 1);
      attempts++;
    }

    setEarliestDelivery('Доставка невозможна в ближайшие 7 дней. Попробуйте позже.');
  }, [storeSettings, isStoreSettingsLoading, product.production_time]);

  useEffect(() => {
    try {
      window.gtag?.('event', 'view_item', {
        event_category: 'ecommerce',
        event_label: product.title,
        value: product.price,
      });
      window.ym?.(96644553, 'reachGoal', 'view_item', { product_id: product.id });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, [product.id, product.title, product.price]);

  const discountPercent = product.discount_percent ?? 0;
  const discountedPrice = discountPercent > 0 ? Math.round(product.price * (1 - discountPercent / 100)) : product.price;
  const bonus = (discountedPrice * bonusPercent).toFixed(2).replace('.', ',');

  const handleAdd = (
    id: number,
    title: string,
    price: number,
    img: string | null,
    productionTime: number | null
  ) => {
    addItem({ id: `${id}`, title, price, quantity: 1, imageUrl: img || '', production_time: productionTime });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
    try {
      window.gtag?.('event', 'add_to_cart', {
        event_category: 'ecommerce',
        event_label: title,
        value: price,
      });
      window.ym?.(96644553, 'reachGoal', 'add_to_cart', { product_id: id });
    } catch (error) {
      console.error('Add to cart analytics error:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.title,
          text: `Посмотрите этот букет: ${product.title} на KeyToHeart!`,
          url: window.location.href,
        })
        .catch((error) => console.error('Share error:', error));
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Ссылка скопирована в буфер обмена!');
      });
    }
  };

  // Чтобы избавиться от ошибок typescript про null
  const images: string[] = Array.isArray(product.images) ? product.images : [];

  return (
    <section className="min-h-screen bg-white text-black" aria-label={`Товар ${product.title}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Галерея */}
          <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            aria-label="Галерея изображений товара"
          >
            <div className="relative">
              <Swiper
                onSwiper={mainSwiper => {
                  mainSwiperRef.current = mainSwiper;
                }}
                onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}
                navigation={{
                  prevEl: '.customSwiperButtonPrev',
                  nextEl: '.customSwiperButtonNext',
                }}
                thumbs={thumbsSwiper ? { swiper: thumbsSwiper } : undefined}
                modules={[Navigation, Thumbs]}
                className={`customSwiper rounded-2xl overflow-hidden relative`}
                slidesPerView={1}
                style={{ minHeight: 360 }}
              >
                {images.map((src, i) => (
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
                {/* Кастомные стрелки */}
                <button className="customSwiperButtonPrev absolute left-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 focus:outline-none">
                  <span className="text-2xl text-white">&#60;</span>
                </button>
                <button className="customSwiperButtonNext absolute right-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 focus:outline-none">
                  <span className="text-2xl text-white">&#62;</span>
                </button>
              </Swiper>

              {/* Миниатюры снизу */}
              {images.length > 1 && (
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={12}
                  slidesPerView={Math.min(images.length, 6)}
                  watchSlidesProgress
                  modules={[Navigation, Thumbs]}
                  className="mt-3"
                  style={{ maxWidth: '100%' }}
                  breakpoints={{
                    320: { slidesPerView: 4 },
                    640: { slidesPerView: 5 },
                    1024: { slidesPerView: 6 },
                  }}
                >
                  {images.map((src, i) => (
                    <SwiperSlide key={i} className="cursor-pointer group">
                      <div
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden border transition-all duration-200 ${activeIndex === i ? 'border-black shadow-lg' : 'border-gray-200'}`}
                        onClick={() => {
                          if (mainSwiperRef.current) {
                            mainSwiperRef.current.slideTo(i);
                          }
                        }}
                      >
                        <Image
                          src={src}
                          alt={`Миниатюра ${i + 1}`}
                          fill
                          className={`object-cover group-hover:scale-105 transition-transform duration-200`}
                          loading="lazy"
                          sizes="(max-width: 768px) 20vw, 8vw"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </motion.div>

          {/* Блок информации */}
          <motion.div
            className="flex flex-col space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Скидка/распродажа/популярное */}
            <div className="flex items-center gap-3">
              {discountPercent > 0 && (
                <span className="px-2 py-1 text-xs font-bold rounded-md bg-black text-white">
                  -{discountPercent}%
                </span>
              )}
              {discountPercent > 0 && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-200 text-black">
                  РАСПРОДАЖА
                </span>
              )}
            </div>
            {/* Название */}
            <h1 className="text-2xl sm:text-3xl font-bold font-sans uppercase tracking-tight mb-1 leading-tight">
              {product.title}
            </h1>
            {/* Цена/скидка/бонус */}
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-4">
                {discountPercent > 0 ? (
                  <>
                    <span className="text-3xl sm:text-4xl font-bold text-black">{discountedPrice}₽</span>
                    <span className="text-xl text-gray-500 line-through">{product.price}₽</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-black text-white">
                      -{(product.price - discountedPrice)}₽
                    </span>
                  </>
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-black">{product.price}₽</span>
                )}
                <span className="text-base sm:text-lg text-black font-medium ml-3 flex items-center gap-1">
                  + бонус {bonus}₽
                  <span
                    className="ml-1 text-gray-400 cursor-pointer"
                    title="Бонус за оплату заказа, начисляется на бонусный счёт клиента"
                  >&#9432;</span>
                </span>
              </div>
            </div>

            {/* Время изготовления, доставка */}
            <div className="flex flex-col gap-2 text-base mt-2">
              {product.production_time != null && (
                <div className="flex items-center gap-2">
                  <Image src="/icons/clock.svg" alt="Время" width={20} height={20} />
                  <span>
                    Время изготовления: {product.production_time} {product.production_time === 1 ? 'час' : 'часов'}
                  </span>
                </div>
              )}
              {earliestDelivery && (
                <div className="flex items-center gap-2">
                  <Image src="/icons/truck.svg" alt="Доставка" width={20} height={20} />
                  <span>{earliestDelivery}</span>
                </div>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <motion.button
                onClick={() =>
                  handleAdd(product.id, product.title, discountedPrice, images[0] || null, product.production_time ?? null)
                }
                className="flex-1 py-3 bg-black text-white rounded-lg text-base font-bold hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-black"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Добавить в корзину"
              >
                ДОБАВИТЬ В КОРЗИНУ
              </motion.button>
              <motion.button
                onClick={handleShare}
                className="p-3 rounded-lg border bg-gray-100 text-black hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-black"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Поделиться"
              >
                <Share2 size={20} />
              </motion.button>
            </div>

            {/* Константный спойлер */}
            <p className="mt-2 text-sm text-gray-600 border-t pt-3">
              Состав букета может быть незначительно изменен. При этом стилистика и цветовая гамма останутся неизменными.
            </p>

            {/* Описание и состав */}
            <div className="space-y-6 mt-2">
              {product.description && (
                <div>
                  <h2 className="font-bold text-lg text-black mb-1">
                    О товаре:
                  </h2>
                  <p className="text-base text-black leading-loose whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
              {product.composition && (
                <div>
                  <h2 className="font-bold text-lg text-black mb-1">
                    Состав:
                  </h2>
                  <ul className="list-disc pl-5 space-y-1 text-base text-black leading-loose">
                    {product.composition.split('\n').map((item, index) => (
                      <li key={index}>{item.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Секция отзывов */}
            <div className="space-y-4 mt-2">
              <h2 className="font-bold text-lg text-black mb-2">
                Отзывы клиентов:
              </h2>
              <div className="space-y-4">
                {[
                  { name: 'Алексей', rating: 5, text: 'Очень вкусная клубника, шоколад тает во рту. У девушки остались только положительные эмоции и красиво и вкусно. Буду заказывать ещё, рекомендую.' },
                  { name: 'Екатерина', rating: 5, text: 'Очень необычно для меня и приятно))))) и девочка очень приветливая привезла, благодарю 🙏' },
                  { name: 'Ольга', rating: 5, text: 'Очень вежливое общение и просто сделано все на 10/10. Однозначно буду иметь в виду этот магазин до дальнейших покупок и буду рекомендовать своим знакомым. Огромное спасибо за ваш труд 🤌🏼💗' },
                ].map((review, index) => (
                  <div key={index} className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">{review.name}</span>
                      <div className="flex">
                        {Array(review.rating).fill(0).map((_, i) => (
                          <Star key={i} size={16} className="text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-base text-gray-700 mt-1">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Рекомендуемые товары */}
        {combos.length > 0 && (
          <motion.section
            className="mt-12 pt-10 border-t border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            aria-label="Рекомендуемые товары"
          >
            <h2 className="text-2xl font-bold text-black mb-6 tracking-tight">
              Рекомендуемые товары
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {combos.slice(0, 4).map((combo) => (
                <motion.div
                  key={combo.id}
                  className="combo-card-desktop flex flex-col items-center group rounded-xl shadow-md overflow-hidden bg-white h-80 transition-transform duration-200 hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative w-full h-44 bg-gray-100">
                    <Image
                      src={combo.image}
                      alt={combo.title}
                      fill
                      className="object-cover transition-transform duration-300"
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3 w-full flex-1 flex flex-col justify-between">
                    <p className="text-base font-semibold text-left truncate">{combo.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base font-bold text-black">
                        {combo.price} ₽
                      </span>
                    </div>
                    <motion.button
                      onClick={() =>
                        handleAdd(combo.id, combo.title, combo.price, combo.image, null)
                      }
                      className="w-full mt-2 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-black"
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
