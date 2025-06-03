// app/product/[id]/ProductPageClient.tsx
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
import { Product, ComboItem } from './types';

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
  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
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

export default function ProductPageClient({ product, combos }: { product: Product; combos: ComboItem[] }) {
  const { addItem } = useCart();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [comboNotifications, setComboNotifications] = useState<{ [key: number]: boolean }>({});
  const [bonusPercent] = useState<number>(0.025);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] = useState(true);
  const [earliestDelivery, setEarliestDelivery] = useState<string | null>(null);
  const [recommendedItems, setRecommendedItems] = useState<ComboItem[]>(combos);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);
  const mainSwiperRef = useRef<any>(null);

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
      } catch (error) {} finally {
        setIsStoreSettingsLoading(false);
      }
    };
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    const fetchRecommendedItems = async () => {
      const cacheKey = 'recommended_items_podarki';
      const cacheTimestampKey = 'recommended_items_podarki_timestamp';

      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(cacheTimestampKey);
      if (cached && timestamp && Date.now() - parseInt(timestamp) < 3600000) {
        setRecommendedItems(JSON.parse(cached));
        setIsLoadingRecommended(false);
        return;
      }

      if (timestamp && Date.now() - parseInt(timestamp) >= 3600000) {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheTimestampKey);
      }

      setIsLoadingRecommended(true);
      try {
        const subcategoryIds = [171, 173];
        const fetchPromises = subcategoryIds.map(async (subcategoryId) => {
          const res = await fetch(
            `/api/upsell/products?category_id=8&subcategory_id=${subcategoryId}`
          );
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const { success, data, error } = await res.json();
          if (!success) throw new Error(error || 'Ошибка загрузки товаров');
          return data || [];
        });

        const results = await Promise.all(fetchPromises);
        const items: ComboItem[] = results
          .flat()
          .filter((item: any) => item.id !== product.id.toString())
          .map((item: any) => ({
            id: parseInt(item.id, 10),
            title: item.title,
            price: item.price,
            image: item.image_url || '/placeholder.jpg',
          }));

        setRecommendedItems(items);
        localStorage.setItem(cacheKey, JSON.stringify(items));
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
      } catch (err: any) {
        setRecommendedItems([]);
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    fetchRecommendedItems();
  }, [product.id]);

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
    const maxAttempts = 7;

    while (attempts < maxAttempts) {
      const dayKey = earliestDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      const orderSchedule = storeSettings.order_acceptance_schedule[dayKey];
      const storeSchedule = storeSettings.store_hours[dayKey];

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
    } catch (error) {}
  }, [product.id, product.title, product.price]);

  const discountPercent = product.discount_percent ?? 0;
  const discountedPrice = discountPercent > 0 ? Math.round(product.price * (1 - discountPercent / 100)) : product.price;
  const bonus = (discountedPrice * bonusPercent).toFixed(2).replace('.', ',');

  const handleAdd = (
    id: number,
    title: string,
    price: number,
    img: string | null,
    productionTime: number | null,
    isCombo: boolean = false
  ) => {
    addItem({ id: `${id}`, title, price, quantity: 1, imageUrl: img || '', production_time: productionTime });
    if (isCombo) {
      setComboNotifications(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setComboNotifications(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } else {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
    try {
      window.gtag?.('event', 'add_to_cart', {
        event_category: 'ecommerce',
        event_label: title,
        value: price,
      });
      window.ym?.(96644553, 'reachGoal', 'add_to_cart', { product_id: id });
    } catch (error) {}
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.title,
          text: `Посмотрите этот букет: ${product.title} на KeyToHeart!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Ссылка скопирована в буфер обмена!');
      });
    }
  };

  const images: string[] = Array.isArray(product.images) ? product.images : [];

  return (
    <section className="min-h-screen bg-white text-black" aria-label={`Товар ${product.title}`}>
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
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
          {Object.entries(comboNotifications).map(([id, isVisible]) =>
            isVisible ? (
              <motion.div
                key={id}
                className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50"
                variants={notificationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                Добавлено в корзину!
              </motion.div>
            ) : null
          )}
        </AnimatePresence>

        {/* Основной grid: плотнее на мобилке */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6 lg:gap-12 items-start">
          {/* Галерея */}
          <motion.div className="w-full mb-2 sm:mb-0" variants={containerVariants} initial="hidden" animate="visible" aria-label="Галерея изображений товара">
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
                loop={false}
                modules={[Navigation, Thumbs]}
                className="customSwiper rounded-2xl overflow-hidden relative"
                slidesPerView={1}
                style={{ minHeight: 320 }}
              >
                {images.length > 0 ? (
                  images.map((src, i) => (
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
                  ))
                ) : (
                  <SwiperSlide>
                    <div className="relative aspect-[4/3] w-full bg-gray-100">
                      <Image
                        src="/placeholder.jpg"
                        alt="Изображение отсутствует"
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </SwiperSlide>
                )}
                <button className="customSwiperButtonPrev absolute left-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 focus:outline-none">
                  <span className="text-2xl text-white">&lt;</span>
                </button>
                <button className="customSwiperButtonNext absolute right-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 focus:outline-none">
                  <span className="text-2xl text-white">&gt;</span>
                </button>
              </Swiper>

              {/* Миниатюры снизу, mt-1 для мобилки */}
              {images.length > 1 && (
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={8}
                  slidesPerView={Math.min(images.length, 6)}
                  watchSlidesProgress
                  modules={[Navigation, Thumbs]}
                  className="mt-1 sm:mt-3"
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
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
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
          <motion.div className="flex flex-col space-y-4 sm:space-y-6" variants={containerVariants} initial="hidden" animate="visible">
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
            <h1 className="text-2xl sm:text-3xl font-bold font-sans uppercase tracking-tight mb-1 leading-tight">
              {product.title}
            </h1>
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
                  >ⓘ</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-base mt-1">
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
            <p className="mt-1 text-sm text-gray-600 border-t pt-3">
              Состав букета может быть незначительно изменен. При этом стилистика и цветовая гамма останутся неизменными.
            </p>
            <div className="space-y-4 mt-2">
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

        {/* Рекомендуемые товары: плотнее для мобилки */}
        {recommendedItems.length > 0 && (
          <motion.section
            className="mt-4 pt-4 sm:mt-10 sm:pt-10 border-t border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            aria-label="Рекомендуемые товары"
          >
            <h2 className="text-2xl font-bold text-black mb-6 tracking-tight">
              Рекомендуемые товары
            </h2>
            {isLoadingRecommended ? (
              <p className="text-gray-500">Загрузка...</p>
            ) : (
              <div className="relative">
                <Swiper
                  navigation={{
                    prevEl: '.recommendSwiperButtonPrev',
                    nextEl: '.recommendSwiperButtonNext',
                  }}
                  loop={recommendedItems.length >= 2}
                  modules={[Navigation]}
                  spaceBetween={12}
                  slidesPerView={2}
                  breakpoints={{
                    320: { slidesPerView: 2, spaceBetween: 12 },
                    640: { slidesPerView: 3, spaceBetween: 20 },
                    1024: { slidesPerView: 4, spaceBetween: 24 },
                  }}
                  className="recommendSwiper"
                >
                  {recommendedItems.map((combo) => (
                    <SwiperSlide key={combo.id}>
                      <motion.div
                        className="flex flex-col rounded-xl shadow-md overflow-hidden bg-white transition-all duration-300 hover:shadow-lg"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="relative w-full aspect-[4/3] bg-gray-100">
                          <Image
                            src={combo.image}
                            alt={combo.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-1 space-y-2">
                          <p className="text-base font-semibold text-black line-clamp-2 h-12">{combo.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-black">{`${combo.price} ₽`}</span>
                          </div>
                          <motion.button
                            onClick={() =>
                              handleAdd(combo.id, combo.title, combo.price, combo.image, null, true)
                            }
                            className="w-full py-3 bg-black text-white rounded-lg text-base font-bold hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-black"
                            variants={buttonVariants}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            aria-label={`Добавить ${combo.title} в корзину`}
                          >
                            ДОБАВИТЬ В КОРЗИНУ
                          </motion.button>
                        </div>
                      </motion.div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                <button className="recommendSwiperButtonPrev absolute left-0 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 focus:outline-none">
                  <span className="text-2xl text-white">&lt;</span>
                </button>
                <button className="recommendSwiperButtonNext absolute right-0 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200 focus:outline-none">
                  <span className="text-2xl text-white">&gt;</span>
                </button>
              </div>
            )}
          </motion.section>
        )}
      </div>
    </section>
  );
}
