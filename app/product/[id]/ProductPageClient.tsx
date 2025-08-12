'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import { ChevronLeft, ChevronRight, Share2, Star } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@context/CartContext';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import type { Product, ComboItem } from './types';

/* =====================  Constants & helpers  ===================== */

// ★ однотонный blur-png (10 × 10 px, светло-серый)
const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z/C/HwMDAwMjIxEABAMAATN4A+QAAAAASUVORK5CYII=';

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
const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const transformSchedule = (schedule: unknown): Record<string, DaySchedule> => {
  const base = Object.fromEntries(
    daysOfWeek.map((d) => [
      d,
      { start: '09:00', end: '18:00', enabled: true },
    ]),
  ) as Record<string, DaySchedule>;
  if (typeof schedule !== 'object' || schedule === null) return base;

  for (const [key, value] of Object.entries(schedule)) {
    if (daysOfWeek.includes(key as any) && typeof value === 'object' && value) {
      const { start, end, enabled } = value as any;
      if (
        typeof start === 'string' &&
        typeof end === 'string' &&
        (enabled === undefined || typeof enabled === 'boolean')
      ) {
        base[key] = { start, end, enabled: enabled ?? true };
      }
    }
  }
  return base;
};

/* =====================       Motion        ====================== */

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

/* ================================================================= */
/*                              COMPONENT                            */
/* ================================================================= */
export default function ProductPageClient({
  product,
  combos,
}: {
  product: Product;
  combos: ComboItem[];
}) {
  /* ------------------------- state & hooks ------------------------ */
  const { addItem } = useCart();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [comboNotifications, setComboNotifications] = useState<Record<number, boolean>>({});
  const [bonusPercent] = useState(0.025);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] = useState(true);
  const [earliestDelivery, setEarliestDelivery] = useState<string | null>(null);
  const [recommendedItems, setRecommendedItems] = useState<ComboItem[]>(combos);
  const recommendLoop = recommendedItems.length > 4;
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);
  const mainSwiperRef = useRef<any>(null);

  /* ------------------------- derived values ----------------------- */
  const discountPercent = product.discount_percent ?? 0;
  const discountedPrice =
    discountPercent > 0
      ? Math.round(product.price * (1 - discountPercent / 100))
      : product.price;
  const bonus = (discountedPrice * bonusPercent).toFixed(2).replace('.', ',');

  const images = useMemo(
    () => (Array.isArray(product.images) ? product.images : []),
    [product.images],
  );

  /* -------------------------- JSON-LD ----------------------------- */
  const productLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description ?? '',
      image: images,
      sku: String(product.id),
      brand: { '@type': 'Brand', name: 'KEY TO HEART' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'RUB',
        price: discountedPrice,
        availability: 'https://schema.org/InStock',
        url: typeof window !== 'undefined' ? window.location.href : 'https://keytoheart.ru',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 5,
        reviewCount: 3,
      },
    }),
    [product.title, product.description, images, discountedPrice, product.id],
  );

  /* ------------------------- side-effects ------------------------- */
  /* загрузка настроек магазина */
  useEffect(() => {
    const fetchSettings = async () => {
      setIsStoreSettingsLoading(true);
      try {
        const res = await fetch('/api/store-settings');
        const json = await res.json();
        if (res.ok && json.success) {
          setStoreSettings({
            order_acceptance_enabled:
              json.data.order_acceptance_enabled ?? false,
            order_acceptance_schedule: transformSchedule(
              json.data.order_acceptance_schedule,
            ),
            store_hours: transformSchedule(json.data.store_hours),
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек магазина:', error);
      } finally {
        setIsStoreSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  /* рекомендация подарков */
  useEffect(() => {
    const fetchRecommendedItems = async () => {
      const cacheKey = 'recommended_items_podarki';
      const tsKey = `${cacheKey}_ts`;
      const cached = localStorage.getItem(cacheKey);
      const ts = localStorage.getItem(tsKey);

      if (cached && ts && Date.now() - +ts < 3_600_000) {
        setRecommendedItems(JSON.parse(cached));
        setIsLoadingRecommended(false);
        return;
      }

      try {
        setIsLoadingRecommended(true);
        const subIds = [171, 173];
        const resArr = await Promise.all(
          subIds.map(async (sub) => {
            const r = await fetch(
              `/api/upsell/products?category_id=8&subcategory_id=${sub}`,
            );
            if (!r.ok) return [];
            const { success, data } = await r.json();
            return success ? data : [];
          }),
        );

        const items: ComboItem[] = resArr
          .flat()
          .filter((it: any) => it.id !== String(product.id))
          .map((it: any) => ({
            id: +it.id,
            title: it.title,
            price: it.price,
            image: it.image_url || '/placeholder.jpg',
          }));

        setRecommendedItems(items);
        localStorage.setItem(cacheKey, JSON.stringify(items));
        localStorage.setItem(tsKey, String(Date.now()));
      } catch (error) {
        console.error('Ошибка загрузки рекомендуемых товаров:', error);
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    fetchRecommendedItems();
  }, [product.id]);

  /* earliest delivery calc */
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
    let earliestDate = new Date(now);
    earliestDate.setHours(earliestDate.getHours() + product.production_time);

    let attempts = 0;
    while (attempts < 7) {
      const dayKey = earliestDate
        .toLocaleString('en-US', { weekday: 'long' })
        .toLowerCase();
      const order = storeSettings.order_acceptance_schedule[dayKey];
      const store = storeSettings.store_hours[dayKey];

      if (order?.enabled === false || store?.enabled === false) {
        earliestDate.setDate(earliestDate.getDate() + 1);
        attempts++;
        continue;
      }

      if (order?.start && order?.end && store?.start && store?.end) {
        const [orderStartH, orderStartM] = order.start.split(':').map(Number);
        const [orderEndH, orderEndM] = order.end.split(':').map(Number);
        const [storeStartH, storeStartM] = store.start.split(':').map(Number);
        const [storeEndH, storeEndM] = store.end.split(':').map(Number);

        const orderStartTime = new Date(earliestDate);
        orderStartTime.setHours(orderStartH, orderStartM, 0, 0);
        const orderEndTime = new Date(earliestDate);
        orderEndTime.setHours(orderEndH, orderEndM, 0, 0);
        const storeStartTime = new Date(earliestDate);
        storeStartTime.setHours(storeStartH, storeStartM, 0, 0);
        const storeEndTime = new Date(earliestDate);
        storeEndTime.setHours(storeEndH, storeEndM, 0, 0);

        const effectiveStart =
          orderStartTime > storeStartTime ? orderStartTime : storeStartTime;
        const effectiveEnd =
          orderEndTime < storeEndTime ? orderEndTime : storeEndTime;

        if (earliestDate < effectiveStart)
          earliestDate = new Date(effectiveStart);

        if (earliestDate <= effectiveEnd) {
          setEarliestDelivery(
            `Самое раннее время доставки: ${earliestDate.toLocaleDateString(
              'ru-RU',
            )} в ${earliestDate.toTimeString().slice(0, 5)}`,
          );
          return;
        }
      }

      earliestDate.setDate(earliestDate.getDate() + 1);
      earliestDate.setHours(9, 0, 0, 0);
      attempts++;
    }

    setEarliestDelivery(
      'Доставка невозможна в ближайшие 7 дней. Попробуйте позже.',
    );
  }, [storeSettings, isStoreSettingsLoading, product.production_time]);

  /* GA / YM view_item */
  useEffect(() => {
    try {
      window.gtag?.('event', 'view_item', {
        event_category: 'ecommerce',
        event_label: product.title,
        value: product.price,
      });
      if (YM_ID !== undefined) {
        callYm(YM_ID, 'reachGoal', 'view_item', { product_id: product.id });
      }
    } catch {}
  }, [product.id, product.title, product.price]);

  function declineWord(num: number, words: [string, string, string]): string {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[(num % 100 > 4 && num % 100 < 20) ? 2 : cases[(num % 10 < 5) ? num % 10 : 5]];
  }
  
  function formatProductionTime(minutes: number | null): string | null {
    if (minutes == null || minutes <= 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let result = '';
    if (hours > 0) {
      result += `${hours} ${declineWord(hours, ['час', 'часа', 'часов'])}`;
    }
    if (mins > 0) {
      if (result) result += ' ';
      result += `${mins} ${declineWord(mins, ['минута', 'минуты', 'минут'])}`;
    }
    return result || 'Мгновенно';
  }

    const handleAdd = (
    id: number,
    title: string,
    price: number,
    img: string | null,
    productionTime: number | null,
    isCombo = false,
  ) => {
    addItem({
      id: String(id),
      title,
      price,
      quantity: 1,
      imageUrl: img || '',
      production_time: productionTime,
    });

    if (isCombo) {
      setComboNotifications((p) => ({ ...p, [id]: true }));
      setTimeout(() => setComboNotifications((p) => ({ ...p, [id]: false })), 2000);
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
      YM_ID && callYm(YM_ID, 'reachGoal', 'add_to_cart', { product_id: id });
    } catch {}
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;

    const url = window.location.href;

    /* Web Share API ─ мобильные Chrome / iOS Safari */
    if (navigator.share) {
      navigator
        .share({
          title: product.title,
          text: `Посмотрите букет «${product.title}» на KEY TO HEART!`,
          url,
        })
        .catch(() => {});        // пользователь отменил
      return;
    }

    /* fallback: копируем ссылку */
    navigator.clipboard
      .writeText(url)
      .then(() => alert('Ссылка скопирована в буфер обмена!'))
      .catch(() => alert('Не удалось скопировать ссылку :('));
  };

 /* =================================================================== */
  /*                                 JSX                                 */
  /* =================================================================== */
  return (
    <section
      className="min-h-screen bg-white text-black"
      aria-label={`Товар ${product.title}`}
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* встроенный JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      {/* micro-meta */}
      <meta itemProp="sku"   content={String(product.id)} />
      <meta itemProp="brand" content="KEY TO HEART" />
      <meta itemProp="name"  content={product.title} />
      {images[0] && <link itemProp="image" href={images[0]} />}

      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* ---------- уведомления ---------- */}
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
          {Object.entries(comboNotifications).map(
            ([id, visible]) =>
              visible && (
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
              ),
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6 lg:gap-12 items-start">
          {/* ===================== GALERY ===================== */}
          <motion.div
            className="w-full mb-2 sm:mb-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative">
              <Swiper
                onSwiper={(s) => (mainSwiperRef.current = s)}
                onSlideChange={(s) => setActiveIndex(s.activeIndex)}
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
                {images.length ? (
                  images.map((src, i) => (
                    <SwiperSlide key={i}>
                      <div className="relative aspect-[4/3] w-full bg-gray-100">
                        <Image
                          src={src}
                          alt={`${product.title} — фото ${i + 1}`}
                          fill
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                          priority={i === 0}
                          loading={i === 0 ? 'eager' : 'lazy'}
                          sizes="(max-width:768px) 100vw, 50vw"
                          className="object-cover"
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
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                        priority
                        className="object-cover"
                      />
                    </div>
                  </SwiperSlide>
                )}

                {/* стрелки */}
                <button
                  className="customSwiperButtonPrev absolute left-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/70 transition"
                  aria-label="Предыдущее изображение"
                >
                  <ChevronLeft className="text-white text-2xl" />
                </button>
                <button
                  className="customSwiperButtonNext absolute right-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/70 transition"
                  aria-label="Следующее изображение"
                >
                  <ChevronRight className="text-white text-2xl" />
                </button>
              </Swiper>

              {/* миниатюры */}
              {images.length > 1 && (
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={8}
                  slidesPerView={Math.min(images.length, 6)}
                  watchSlidesProgress
                  modules={[Navigation, Thumbs]}
                  className="mt-1 sm:mt-3"
                  breakpoints={{
                    320:  { slidesPerView: 4 },
                    640:  { slidesPerView: 5 },
                    1024: { slidesPerView: 6 },
                  }}
                >
                  {images.map((src, i) => (
                    <SwiperSlide key={i} className="cursor-pointer group">
                      <div
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden border transition ${
                          activeIndex === i
                            ? 'border-black shadow-lg'
                            : 'border-gray-200'
                        }`}
                        onClick={() => mainSwiperRef.current?.slideTo(i)}
                      >
                        <Image
                          src={src}
                          alt={`Миниатюра ${i + 1}`}
                          fill
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                          loading="lazy"
                          sizes="(max-width:768px) 20vw, 8vw"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </motion.div>


          {/* ---------- правая колонка ---------- */}
          <motion.div
            className="flex flex-col space-y-4 sm:space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* бейджи */}
            <div className="flex items-center gap-3">
              {discountPercent > 0 && (
                <>
                  <span className="px-2 py-1 text-xs font-bold rounded bg-black text-white">
                    -{discountPercent}%
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-200">
                    РАСПРОДАЖА
                  </span>
                </>
              )}
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold uppercase tracking-tight leading-tight"
              itemProp="name"
            >
              {product.title}
            </h1>

            {/* offers microdata */}
            <div
              itemProp="offers"
              itemScope
              itemType="https://schema.org/Offer"
              className="flex flex-col gap-2"
            >
              <meta itemProp="priceCurrency" content="RUB" />
              <link
                itemProp="availability"
                href="https://schema.org/InStock"
              />
              <div className="flex items-end gap-4">
                <span
                  className="text-3xl sm:text-4xl font-bold"
                  itemProp="price"
                  content={String(discountedPrice)}
                >
                  {discountedPrice} ₽
                </span>
                {discountPercent > 0 && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {product.price}₽
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-black text-white">
                      -{product.price - discountedPrice}₽
                    </span>
                  </>
                )}
                <span className="ml-3 text-base sm:text-lg flex items-center gap-1">
                  + бонус {bonus}₽
                  <span
                    className="ml-1 text-gray-600 cursor-pointer"
                    title="Бонус за оплату заказа"
                  >
                    ⓘ
                  </span>
                </span>
              </div>
            </div>

            {/* доставка / изготовление */}
            <div className="flex flex-col gap-2 text-base">
              {product.production_time != null && (
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/clock.svg"
                    alt=""
                    width={20}
                    height={20}
                  />
                  <span>
                    Время изготовления: {formatProductionTime(product.production_time) || 'Не указано'}
                  </span>
                </div>
              )}
              {earliestDelivery && (
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/truck.svg"
                    alt=""
                    width={20}
                    height={20}
                  />
                  <span>{earliestDelivery}</span>
                </div>
              )}
            </div>

            {/* кнопки */}
            <div className="flex gap-3">
              <motion.button
                onClick={() =>
                  handleAdd(
                    product.id,
                    product.title,
                    discountedPrice,
                    images[0] || null,
                    product.production_time ?? null,
                  )
                }
                className="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Добавить в корзину"
                rel="nofollow"
              >
                ДОБАВИТЬ В КОРЗИНУ
              </motion.button>
              <motion.button
                onClick={handleShare}
                className="p-3 rounded-lg border bg-gray-100 hover:bg-gray-200 transition"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Поделиться"
              >
                <Share2 size={20} />
              </motion.button>
            </div>

            {/* описание */}
            {product.description && (
              <section className="space-y-1 pt-3 border-t">
                <h2 className="font-bold text-lg">О товаре</h2>
                <p
                  className="whitespace-pre-line leading-loose"
                  itemProp="description"
                >
                  {product.description}
                </p>
              </section>
            )}

            {/* состав */}
            {product.composition && (
              <section className="space-y-1">
                <h2 className="font-bold text-lg">Состав</h2>
                <ul className="list-disc pl-5 leading-loose">
                  {product.composition.split('\n').map((row, i) => (
                    <li key={i}>{row.trim()}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* отзывы */}
            <section className="space-y-4">
              <h2 className="font-bold text-lg">Отзывы клиентов</h2>
              {[
                {
                  name: 'Анна',
                  rating: 5,
                  text: 'Дарила подруге на ДР, она была приятно удивлена! Радовалась, что вкусно и красиво! Спасибо! 🤍',
                },
                {
                  name: 'Екатерина',
                  rating: 5,
                  text: 'Замечательный букет, очень понравился и по вкусу и по виду!',
                },
                {
                  name: 'Ольга',
                  rating: 5,
                  text: 'Спасибо большое за вкусный букет! Это был важный знак внимания для любимой семьи и вы в этом мне очень помогли! Благодарю ❤️🙏🏻🍓',
                },
              ].map((review, i) => (
                <div key={i} className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.name}</span>
                    <div className="flex">
                      {Array(review.rating)
                        .fill(0)
                        .map((_, j) => (
                          <Star
                            key={j}
                            size={16}
                            className="text-yellow-500 fill-current"
                          />
                        ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mt-1">{review.text}</p>
                </div>
              ))}
            </section>
          </motion.div>
        </div>

        {/* рекомендация */}
        {recommendedItems.length > 0 && (
          <motion.section
            className="mt-4 pt-4 sm:mt-10 sm:pt-10 border-t"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-2xl font-bold mb-6 tracking-tight">
              Рекомендуемые товары
            </h2>
            {isLoadingRecommended ? (
              <p className="text-gray-500">Загрузка…</p>
            ) : (
              <div className="relative">
                <Swiper
                  navigation={{
                    prevEl: '.recommendSwiperButtonPrev',
                    nextEl: '.recommendSwiperButtonNext',
                  }}
                  loop={recommendLoop}
                  modules={[Navigation]}
                  spaceBetween={12}
                  slidesPerView={2}
                  breakpoints={{
                    320: { slidesPerView: 2, spaceBetween: 12 },
                    640: { slidesPerView: 3, spaceBetween: 20 },
                    1024: { slidesPerView: 4, spaceBetween: 24 },
                  }}
                >
                  {recommendedItems.map((combo) => (
                    <SwiperSlide key={combo.id}>
                      <motion.div
                        className="flex flex-col rounded-xl shadow-md overflow-hidden bg-white hover:shadow-lg transition"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="relative w-full aspect-[4/3] bg-gray-100">
                          <Image
                            src={combo.image}
                            alt={combo.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-1 space-y-2">
                          <p className="line-clamp-2 h-12 font-semibold">
                            {combo.title}
                          </p>
                          <span className="text-lg font-bold">
                            {combo.price} ₽
                          </span>
                          <motion.button
                            onClick={() =>
                              handleAdd(
                                combo.id,
                                combo.title,
                                combo.price,
                                combo.image,
                                null,
                                true,
                              )
                            }
                            className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition"
                            variants={buttonVariants}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            rel="nofollow"
                          >
                            ДОБАВИТЬ В КОРЗИНУ
                          </motion.button>
                        </div>
                      </motion.div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                <button
                  className="recommendSwiperButtonPrev absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/70 transition"
                  aria-label="Предыдущий товар"
                >
                  <ChevronLeft className="text-white text-2xl" />
                </button>
                <button
                  className="recommendSwiperButtonNext absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/70 transition"
                  aria-label="Следующий товар"
                >
                  <ChevronRight className="text-white text-2xl" />
                </button>
              </div>
            )}
          </motion.section>
        )}
      </div>
    </section>
  );
}