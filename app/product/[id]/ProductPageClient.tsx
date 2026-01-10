// ✅ Путь: app/product/[id]/ProductPageClient.tsx
'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import { ChevronLeft, ChevronRight, Share2, Star } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@context/CartContext';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import type { Product, ComboItem } from './types';

import ComboBuilderModal, {
  type ComboPickerType,
  type SelectableProduct,
} from './ComboBuilderModal';

// blur placeholder
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
    daysOfWeek.map((d) => [d, { start: '09:00', end: '18:00', enabled: true }]),
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

const containerVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.985 },
};
const notificationVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.2 } },
};

function declineWord(num: number, words: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    num % 100 > 4 && num % 100 < 20 ? 2 : cases[num % 10 < 5 ? num % 10 : 5]
  ];
}

function formatProductionTime(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let result = '';
  if (hours > 0) result += `${hours} ${declineWord(hours, ['час', 'часа', 'часов'])}`;
  if (mins > 0) result += `${result ? ' ' : ''}${mins} ${declineWord(mins, ['минута', 'минуты', 'минут'])}`;
  return result || 'Мгновенно';
}

function money(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

function percentToMultiplier(p: number) {
  return 1 - p / 100;
}

// 5% за второй базовый и/или за шары (итого 0/5/10)
function calcDiscountPercent(opts: { hasSecondBase: boolean; hasBalloons: boolean }) {
  const parts = (opts.hasSecondBase ? 1 : 0) + (opts.hasBalloons ? 1 : 0);
  return parts * 5;
}

type RawProductAny = any;

function toSelectable(raw: RawProductAny, kind: ComboPickerType): SelectableProduct | null {
  const id = Number(raw?.id);
  const title = String(raw?.title ?? '');
  const price = Number(raw?.price ?? 0);

  const image = String(
    raw?.image_url ??
      raw?.image ??
      raw?.imageUrl ??
      (Array.isArray(raw?.images) && raw.images[0] ? raw.images[0] : '') ??
      '',
  );

  const production_time =
    raw?.production_time != null ? Number(raw.production_time) : null;

  if (!id || !title || !Number.isFinite(price)) return null;

  return {
    id,
    title,
    price,
    image: image || '/placeholder.jpg',
    production_time,
    kind,
  };
}

/* -------------------------- IDs (как у тебя) -------------------------- */

// ⚠️ проверь свои ID категорий/подкатегорий - оставляю как у тебя
const CATEGORY_FLOWERS_ID = 3;
const CATEGORY_BERRIES_ID = 1;
const CATEGORY_GIFTS_ID = 8;

// подкатегории в "Подарки"
const SUB_BALLOONS_ID = 173; // Шары
const SUB_CARDS_ID = 171; // Открытки

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
  const [comboNotifications, setComboNotifications] = useState<Record<number, boolean>>({});

  const [bonusPercent] = useState(0.025);

  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] = useState(true);
  const [earliestDelivery, setEarliestDelivery] = useState<string | null>(null);

  // блок "Добавьте к заказу" (вне комбо)
  const [recommendedItems, setRecommendedItems] = useState<ComboItem[]>(combos || []);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);

  // похожие товары
  const [similarItems, setSimilarItems] = useState<ComboItem[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(true);

  const mainSwiperRef = useRef<any>(null);

  const discountPercent = product.discount_percent ?? 0;
  const discountedPrice =
    discountPercent > 0 ? Math.round(product.price * (1 - discountPercent / 100)) : product.price;

  const bonus = (discountedPrice * bonusPercent).toFixed(2).replace('.', ',');

  const images = useMemo(
    () => (Array.isArray(product.images) ? product.images : []),
    [product.images],
  );

  // определяем тип товара без description, чтобы цветы не ловили клубнику из текста
  const textBlob = useMemo(() => {
    const parts = [product.title, product.composition].filter(Boolean).join(' ').toLowerCase();
    return parts;
  }, [product.title, product.composition]);

  const isBerryProduct = useMemo(() => {
    const hasStrawberry = /клубник/.test(textBlob);
    const hasChocolate = /шоколад|бельгийск/.test(textBlob);
    return hasStrawberry || hasChocolate;
  }, [textBlob]);

  const trustLines = useMemo(() => {
    const base = ['Доставка от 30 минут', 'Фото перед отправкой'];
    if (isBerryProduct) base.push('Свежая клубника', 'Бельгийский шоколад');
    else base.push('Свежие цветы', 'Аккуратная сборка');
    return base.slice(0, 4);
  }, [isBerryProduct]);

  const recommendLoop = recommendedItems.length > 4;
  const similarLoop = similarItems.length > 4;

  const handleAdd = useCallback(
    (
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
        setTimeout(() => setComboNotifications((p) => ({ ...p, [id]: false })), 1800);
      } else {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 1800);
      }

      try {
        window.gtag?.('event', 'add_to_cart', {
          event_category: 'ecommerce',
          event_label: title,
          value: price,
        });
        YM_ID && callYm(YM_ID, 'reachGoal', 'add_to_cart', { product_id: id });
      } catch {}
    },
    [addItem],
  );

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    if (navigator.share) {
      navigator
        .share({
          title: product.title,
          text: `Посмотрите «${product.title}» на KEY TO HEART!`,
          url,
        })
        .catch(() => {});
      return;
    }

    navigator.clipboard
      .writeText(url)
      .then(() => alert('Ссылка скопирована в буфер обмена!'))
      .catch(() => alert('Не удалось скопировать ссылку :('));
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') window.history.back();
  };

  /* -------------------------- STORE SETTINGS -------------------------- */
  useEffect(() => {
    const fetchSettings = async () => {
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
        console.error('Ошибка загрузки настроек магазина:', error);
      } finally {
        setIsStoreSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  /* -------------------------- UPSELL (вне комбо): ШАРЫ + ОТКРЫТКИ -------------------------- */
  useEffect(() => {
    const fetchRecommendedItems = async () => {
      const cacheKey = 'recommended_items_podarki';
      const tsKey = `${cacheKey}_ts`;

      try {
        const cached = localStorage.getItem(cacheKey);
        const ts = localStorage.getItem(tsKey);
        if (cached && ts && Date.now() - +ts < 3_600_000) {
          setRecommendedItems(JSON.parse(cached));
          setIsLoadingRecommended(false);
          return;
        }
      } catch {}

      try {
        setIsLoadingRecommended(true);

        const subIds = [SUB_CARDS_ID, SUB_BALLOONS_ID];
        const resArr = await Promise.all(
          subIds.map(async (sub) => {
            const r = await fetch(
              `/api/upsell/products?category_id=${CATEGORY_GIFTS_ID}&subcategory_id=${sub}`,
            );
            if (!r.ok) return [];
            const { success, data } = await r.json();
            return success ? data : [];
          }),
        );

        const items: ComboItem[] = resArr
          .flat()
          .filter((it: any) => Number(it.id) !== Number(product.id))
          .map((it: any) => ({
            id: Number(it.id),
            title: it.title,
            price: it.price,
            image: it.image_url || it.image || '/placeholder.jpg',
          }));

        setRecommendedItems(items);

        try {
          localStorage.setItem(cacheKey, JSON.stringify(items));
          localStorage.setItem(tsKey, String(Date.now()));
        } catch {}
      } catch (error) {
        console.error('Ошибка загрузки допродаж:', error);
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    fetchRecommendedItems();
  }, [product.id]);

  /* -------------------------- SIMILAR -------------------------- */
  useEffect(() => {
    const fetchSimilar = async () => {
      const cacheKey = `similar_items_${product.id}`;
      const tsKey = `${cacheKey}_ts`;

      try {
        const cached = localStorage.getItem(cacheKey);
        const ts = localStorage.getItem(tsKey);
        if (cached && ts && Date.now() - +ts < 30 * 60 * 1000) {
          setSimilarItems(JSON.parse(cached));
          setIsLoadingSimilar(false);
          return;
        }
      } catch {}

      try {
        setIsLoadingSimilar(true);
        const r = await fetch(`/api/recommendations?product_id=${product.id}&limit=12`);
        const json = await r.json();
        if (!r.ok || !json?.success) {
          setSimilarItems([]);
          return;
        }
        setSimilarItems(json.data || []);

        try {
          localStorage.setItem(cacheKey, JSON.stringify(json.data || []));
          localStorage.setItem(tsKey, String(Date.now()));
        } catch {}
      } catch (e) {
        console.error('Ошибка загрузки похожих товаров:', e);
        setSimilarItems([]);
      } finally {
        setIsLoadingSimilar(false);
      }
    };

    fetchSimilar();
  }, [product.id]);

  /* -------------------------- EARLIEST DELIVERY -------------------------- */
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
    const totalMinutes = product.production_time + 30;
    let earliestDate = new Date(now.getTime() + totalMinutes * 60 * 1000);
    let attempts = 0;

    while (attempts < 7) {
      const dayKey = earliestDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
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

        const effectiveStart = orderStartTime > storeStartTime ? orderStartTime : storeStartTime;
        const effectiveEnd = orderEndTime < storeEndTime ? orderEndTime : storeEndTime;

        if (earliestDate < effectiveStart) earliestDate = new Date(effectiveStart);

        if (earliestDate <= effectiveEnd) {
          setEarliestDelivery(
            `Самое раннее время доставки: ${earliestDate.toLocaleDateString('ru-RU')} в ${earliestDate
              .toTimeString()
              .slice(0, 5)}`,
          );
          return;
        }
      }

      earliestDate.setDate(earliestDate.getDate() + 1);
      earliestDate.setHours(9, 0, 0, 0);
      attempts++;
    }

    setEarliestDelivery('Доставка невозможна в ближайшие 7 дней. Попробуйте позже.');
  }, [storeSettings, isStoreSettingsLoading, product.production_time]);

  /* -------------------------- ANALYTICS view_item -------------------------- */
  useEffect(() => {
    try {
      window.gtag?.('event', 'view_item', {
        event_category: 'ecommerce',
        event_label: product.title,
        value: product.price,
      });
      if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'view_item', { product_id: product.id });
    } catch {}
  }, [product.id, product.title, product.price]);

  /* -------------------------- COMBO STATE -------------------------- */

  const [comboOpen, setComboOpen] = useState(false);
  const [comboView, setComboView] = useState<'main' | 'pick'>('main');
  const [activePick, setActivePick] = useState<ComboPickerType>('flowers');

  const [selSecondBase, setSelSecondBase] = useState<SelectableProduct | null>(null);
  const [selBalloons, setSelBalloons] = useState<SelectableProduct | null>(null);
  const [selCard, setSelCard] = useState<SelectableProduct | null>(null);

  const [listFlowers, setListFlowers] = useState<SelectableProduct[] | null>(null);
  const [listBerries, setListBerries] = useState<SelectableProduct[] | null>(null);
  const [listBalloons, setListBalloons] = useState<SelectableProduct[] | null>(null);
  const [listCards, setListCards] = useState<SelectableProduct[] | null>(null);

  const [loadingPick, setLoadingPick] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const resetCombo = useCallback(() => {
    setSelSecondBase(null);
    setSelBalloons(null);
    setSelCard(null);
    setComboView('main');
    setActivePick(isBerryProduct ? 'flowers' : 'berries');
  }, [isBerryProduct]);

  const openCombo = () => {
    setComboOpen(true);
    setComboView('main');
    setPickError(null);
    setActivePick(isBerryProduct ? 'flowers' : 'berries');
  };

  const closeCombo = () => {
    setComboOpen(false);
    setComboView('main');
    setPickError(null);
  };

  const fetchPickList = useCallback(
    async (type: ComboPickerType) => {
      if (type === 'flowers' && listFlowers) return;
      if (type === 'berries' && listBerries) return;
      if (type === 'balloons' && listBalloons) return;
      if (type === 'cards' && listCards) return;

      setLoadingPick(true);
      setPickError(null);

      try {
        let url = '';

        if (type === 'flowers') url = `/api/upsell/products?category_id=${CATEGORY_FLOWERS_ID}`;
        if (type === 'berries') url = `/api/upsell/products?category_id=${CATEGORY_BERRIES_ID}`;

        // ⚠️ ключевое: шары и открытки только из ПОДАРКОВ
        if (type === 'balloons')
          url = `/api/upsell/products?category_id=${CATEGORY_GIFTS_ID}&subcategory_id=${SUB_BALLOONS_ID}`;
        if (type === 'cards')
          url = `/api/upsell/products?category_id=${CATEGORY_GIFTS_ID}&subcategory_id=${SUB_CARDS_ID}`;

        const r = await fetch(url);
        const j = await r.json();
        if (!r.ok || !j?.success) throw new Error(j?.error || 'Не удалось загрузить товары');

        const items = (j.data || [])
          .map((it: any) => toSelectable(it, type))
          .filter(Boolean) as SelectableProduct[];

        // не даём выбрать тот же товар, что открыт сейчас
        const filtered = items.filter((it) => it.id !== product.id);

        if (type === 'flowers') setListFlowers(filtered);
        if (type === 'berries') setListBerries(filtered);
        if (type === 'balloons') setListBalloons(filtered);
        if (type === 'cards') setListCards(filtered);
      } catch (e: any) {
        setPickError(e?.message || 'Ошибка загрузки');
      } finally {
        setLoadingPick(false);
      }
    },
    [listFlowers, listBerries, listBalloons, listCards, product.id],
  );

  const startPick = async (type: ComboPickerType) => {
    setActivePick(type);
    setComboView('pick');
    await fetchPickList(type);
  };

  const removeSelection = (type: ComboPickerType) => {
    if (type === 'flowers' || type === 'berries') setSelSecondBase(null);
    if (type === 'balloons') setSelBalloons(null);
    if (type === 'cards') setSelCard(null);
  };

  const selectItem = (it: SelectableProduct) => {
    if (it.kind === 'flowers' || it.kind === 'berries') setSelSecondBase(it);
    if (it.kind === 'balloons') setSelBalloons(it);
    if (it.kind === 'cards') setSelCard(it);
    setComboView('main');
  };

  const baseSelectable: SelectableProduct = useMemo(
    () => ({
      id: product.id,
      title: product.title,
      price: discountedPrice,
      image: images[0] || '/placeholder.jpg',
      production_time: product.production_time ?? null,
      kind: isBerryProduct ? 'berries' : 'flowers',
    }),
    [product.id, product.title, discountedPrice, images, product.production_time, isBerryProduct],
  );

  const comboDiscountPercent = useMemo(() => {
    const hasSecondBase = !!selSecondBase;
    const hasBalloons = !!selBalloons;
    return calcDiscountPercent({ hasSecondBase, hasBalloons });
  }, [selSecondBase, selBalloons]);

  const comboItemsForCalc = useMemo(() => {
    // скидка применяется к "основе + второй базе + шарам"
    // открытка отдельная (без скидки)
    const items: Array<{ it: SelectableProduct; discounted: boolean }> = [
      { it: baseSelectable, discounted: comboDiscountPercent > 0 },
    ];
    if (selSecondBase) items.push({ it: selSecondBase, discounted: comboDiscountPercent > 0 });
    if (selBalloons) items.push({ it: selBalloons, discounted: comboDiscountPercent > 0 });
    if (selCard) items.push({ it: selCard, discounted: false });
    return items;
  }, [baseSelectable, selSecondBase, selBalloons, selCard, comboDiscountPercent]);

  const comboTotals = useMemo(() => {
    const multiplier = percentToMultiplier(comboDiscountPercent);

    const originalSum = comboItemsForCalc.reduce((acc, row) => acc + row.it.price, 0);
    const discountedSum = comboItemsForCalc.reduce((acc, row) => {
      const price = row.discounted ? Math.round(row.it.price * multiplier) : row.it.price;
      return acc + price;
    }, 0);

    const discountRub = Math.max(0, originalSum - discountedSum);
    return { originalSum, discountedSum, discountRub };
  }, [comboItemsForCalc, comboDiscountPercent]);

  const addComboToCart = () => {
    const multiplier = percentToMultiplier(comboDiscountPercent);

    comboItemsForCalc.forEach(({ it, discounted }) => {
      const finalPrice = discounted ? Math.round(it.price * multiplier) : it.price;

      handleAdd(it.id, it.title, finalPrice, it.image || null, it.production_time ?? null, true);
    });

    closeCombo();
    resetCombo();
  };

  const pickList = useMemo(() => {
    if (activePick === 'flowers') return listFlowers ?? [];
    if (activePick === 'berries') return listBerries ?? [];
    if (activePick === 'balloons') return listBalloons ?? [];
    return listCards ?? [];
  }, [activePick, listFlowers, listBerries, listBalloons, listCards]);

  const pickTitle = useMemo(() => {
    if (activePick === 'flowers') return 'Выберите букет';
    if (activePick === 'berries') return 'Выберите клубнику';
    if (activePick === 'balloons') return 'Выберите шары';
    return 'Выберите открытку';
  }, [activePick]);

  const pickTabs = useMemo(() => {
    const baseIsBerry = isBerryProduct;
    const baseSecondTab: ComboPickerType = baseIsBerry ? 'flowers' : 'berries';
    return [
      { t: baseSecondTab, label: 'Букеты' },
      { t: baseIsBerry ? 'berries' : 'flowers', label: 'Клубника' },
      { t: 'balloons', label: 'Шары' },
      { t: 'cards', label: 'Подарки' },
    ] as const;
  }, [isBerryProduct]);

  const onTabChange = async (t: ComboPickerType) => {
    setActivePick(t);
    await fetchPickList(t);
  };

  /* -------------------------- RENDER -------------------------- */
  return (
    <section className="min-h-screen bg-white text-black" aria-label={`Товар ${product.title}`}>
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 pb-28 lg:pb-8">
        {/* мобильная верхняя панель */}
        <div className="flex items-center justify-between mb-3 lg:hidden">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm"
            aria-label="Назад"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full bg-gray-100 p-2"
            aria-label="Поделиться"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* уведомления */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              className="
                fixed z-50
                bg-black text-white px-4 py-3 rounded-2xl shadow-lg
                left-1/2 bottom-24 -translate-x-1/2 w-[92%] max-w-sm
                md:top-4 md:right-4 md:left-auto md:bottom-auto md:translate-x-0
              "
              variants={notificationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-live="assertive"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs sm:text-sm font-medium">Товар добавлен в корзину</span>
                <a
                  href="/cart"
                  className="text-[11px] sm:text-xs font-semibold uppercase tracking-tight bg-white text-black rounded-full px-3 py-1"
                >
                  В корзину
                </a>
              </div>
            </motion.div>
          )}

          {Object.entries(comboNotifications).map(
            ([id, visible]) =>
              visible && (
                <motion.div
                  key={id}
                  className="
                    fixed z-50
                    bg-black text-white px-4 py-3 rounded-2xl shadow-lg
                    left-1/2 bottom-24 -translate-x-1/2 w-[92%] max-w-sm
                    md:top-4 md:right-4 md:left-auto md:bottom-auto md:translate-x-0
                  "
                  variants={notificationVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  aria-live="assertive"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-medium">Товар добавлен в корзину</span>
                    <a
                      href="/cart"
                      className="text-[11px] sm:text-xs font-semibold uppercase tracking-tight bg-white text-black rounded-full px-3 py-1"
                    >
                      В корзину
                    </a>
                  </div>
                </motion.div>
              ),
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6 lg:gap-12 items-start">
          {/* GALERY */}
          <motion.div className="w-full" variants={containerVariants} initial="hidden" animate="visible">
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
                      <div className="relative aspect-[4/5] sm:aspect-[4/3] w-full bg-gray-100">
                        <Image
                          src={src}
                          alt={`${product.title} - фото ${i + 1}`}
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
                    <div className="relative aspect-[4/5] sm:aspect-[4/3] w-full bg-gray-100">
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

                <button
                  className="customSwiperButtonPrev hidden lg:flex absolute left-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full items-center justify-center hover:bg-black/70 transition"
                  aria-label="Предыдущее изображение"
                >
                  <ChevronLeft className="text-white text-2xl" />
                </button>
                <button
                  className="customSwiperButtonNext hidden lg:flex absolute right-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full items-center justify-center hover:bg-black/70 transition"
                  aria-label="Следующее изображение"
                >
                  <ChevronRight className="text-white text-2xl" />
                </button>
              </Swiper>

              {images.length > 1 && (
                <Swiper
                  onSwiper={setThumbsSwiper}
                  spaceBetween={8}
                  slidesPerView={Math.min(images.length, 6)}
                  watchSlidesProgress
                  modules={[Navigation, Thumbs]}
                  className="mt-1 sm:mt-3"
                  breakpoints={{
                    320: { slidesPerView: 4 },
                    640: { slidesPerView: 5 },
                    1024: { slidesPerView: 6 },
                  }}
                >
                  {images.map((src, i) => (
                    <SwiperSlide key={i} className="cursor-pointer group">
                      <div
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden border transition ${
                          activeIndex === i ? 'border-black shadow-lg' : 'border-gray-200'
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

            {/* DESKTOP - Похожие товары */}
            <div className="hidden lg:block mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight">Похожие товары</h2>
                <div className="flex gap-2">
                  <button
                    className="similarPrevInline w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 transition flex items-center justify-center"
                    aria-label="Назад"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    className="similarNextInline w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 transition flex items-center justify-center"
                    aria-label="Вперёд"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isLoadingSimilar ? (
                <p className="text-gray-500">Загрузка…</p>
              ) : similarItems.length === 0 ? (
                <p className="text-gray-500">Пока нет похожих товаров</p>
              ) : (
                <Swiper
                  navigation={{ prevEl: '.similarPrevInline', nextEl: '.similarNextInline' }}
                  loop={similarLoop}
                  modules={[Navigation]}
                  spaceBetween={12}
                  slidesPerView={2}
                >
                  {similarItems.slice(0, 8).map((it) => (
                    <SwiperSlide key={it.id}>
                      <div className="group rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition">
                        <Link href={`/product/${it.id}`} className="block">
                          <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                            <Image
                              src={it.image}
                              alt={it.title}
                              fill
                              placeholder="blur"
                              blurDataURL={BLUR_PLACEHOLDER}
                              className="object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>
                        </Link>

                        <div className="p-3">
                          <Link href={`/product/${it.id}`} className="block">
                            <p className="text-sm font-semibold line-clamp-2 min-h-[40px]">
                              {it.title}
                            </p>
                          </Link>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="font-bold">{it.price} ₽</span>
                            <button
                              onClick={() => handleAdd(it.id, it.title, it.price, it.image, null, true)}
                              className="px-3 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition"
                              rel="nofollow"
                            >
                              В корзину
                            </button>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            {/* DESKTOP - Допродажи */}
            <div className="hidden lg:block mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight">Добавьте к заказу</h2>
                <div className="flex gap-2">
                  <button
                    className="recommendPrevInline w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 transition flex items-center justify-center"
                    aria-label="Назад"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    className="recommendNextInline w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 transition flex items-center justify-center"
                    aria-label="Вперёд"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isLoadingRecommended ? (
                <p className="text-gray-500">Загрузка…</p>
              ) : recommendedItems.length === 0 ? (
                <p className="text-gray-500">Пока нет допов</p>
              ) : (
                <Swiper
                  navigation={{ prevEl: '.recommendPrevInline', nextEl: '.recommendNextInline' }}
                  loop={recommendLoop}
                  modules={[Navigation]}
                  spaceBetween={12}
                  slidesPerView={2}
                >
                  {recommendedItems.slice(0, 10).map((combo) => (
                    <SwiperSlide key={combo.id}>
                      <div className="group rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition">
                        <Link href={`/product/${combo.id}`} className="block">
                          <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                            <Image
                              src={combo.image}
                              alt={combo.title}
                              fill
                              placeholder="blur"
                              blurDataURL={BLUR_PLACEHOLDER}
                              className="object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>
                        </Link>

                        <div className="p-3">
                          <Link href={`/product/${combo.id}`} className="block">
                            <p className="text-sm font-semibold line-clamp-2 min-h-[40px]">
                              {combo.title}
                            </p>
                          </Link>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="font-bold">{combo.price} ₽</span>
                            <button
                              onClick={() =>
                                handleAdd(combo.id, combo.title, combo.price, combo.image, null, true)
                              }
                              className="px-3 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition"
                              rel="nofollow"
                            >
                              В корзину
                            </button>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </motion.div>

          {/* правая колонка */}
          <motion.div
            className="flex flex-col space-y-4 sm:space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* скидки */}
            <div className="flex items-center gap-3 mt-1">
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

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* цена */}
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-3 lg:gap-4">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {discountedPrice} ₽
                </span>
                {discountPercent > 0 && (
                  <>
                    <span className="text-base sm:text-lg text-gray-500 line-through">
                      {product.price}₽
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-black text-white">
                      -{product.price - discountedPrice}₽
                    </span>
                  </>
                )}
              </div>

              <span className="text-sm sm:text-base flex items-center gap-1 text-gray-700">
                + бонус {bonus}₽ <span className="ml-1 text-gray-500 cursor-pointer" title="Бонус за оплату заказа">ⓘ</span>
              </span>
            </div>

            {/* изготовление / доставка */}
            <div className="flex flex-col gap-2 text-sm sm:text-base">
              {product.production_time != null && (
                <div className="flex items-center gap-2">
                  <Image src="/icons/clock.svg" alt="" width={20} height={20} />
                  <span>
                    Время изготовления: {formatProductionTime(product.production_time) || 'Не указано'}
                  </span>
                </div>
              )}
              {earliestDelivery && (
                <div className="flex items-center gap-2">
                  <Image src="/icons/truck.svg" alt="" width={20} height={20} />
                  <span>{earliestDelivery}</span>
                </div>
              )}
            </div>

            {/* trust chips */}
            <div className="grid grid-cols-2 gap-2">
              {trustLines.map((t) => (
                <div
                  key={t}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-semibold"
                >
                  {t}
                </div>
              ))}
            </div>

            {/* кнопки (desktop) */}
            <div className="hidden lg:flex gap-3">
              <motion.button
                onClick={() =>
                  handleAdd(product.id, product.title, discountedPrice, images[0] || null, product.production_time ?? null)
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
                onClick={openCombo}
                className="flex-1 py-3 rounded-lg font-bold border border-black bg-white text-black hover:bg-gray-50 transition"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Собрать комбо"
                rel="nofollow"
              >
                СОБРАТЬ КОМБО -10%
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
                <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base">
                  {product.description}
                </p>
              </section>
            )}

            {/* состав */}
            {product.composition && (
              <section className="space-y-1">
                <h2 className="font-bold text-lg">Состав</h2>
                <ul className="list-disc pl-5 leading-relaxed text-sm sm:text-base">
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
                          <Star key={j} size={16} className="text-yellow-500 fill-current" />
                        ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mt-1 text-sm sm:text-base">{review.text}</p>
                </div>
              ))}
            </section>
          </motion.div>
        </div>

        {/* MOBILE - похожие товары */}
        <motion.section
          className="lg:hidden mt-6 pt-6 border-t"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-xl font-bold mb-4 tracking-tight">Похожие товары</h2>

          {isLoadingSimilar ? (
            <p className="text-gray-500">Загрузка…</p>
          ) : similarItems.length === 0 ? (
            <p className="text-gray-500">Пока нет похожих товаров</p>
          ) : (
            <Swiper
              navigation={{
                prevEl: '.similarPrevMobile',
                nextEl: '.similarNextMobile',
              }}
              loop={similarLoop}
              modules={[Navigation]}
              spaceBetween={12}
              slidesPerView={2}
              breakpoints={{
                320: { slidesPerView: 2, spaceBetween: 12 },
                640: { slidesPerView: 3, spaceBetween: 16 },
              }}
            >
              {similarItems.map((it) => (
                <SwiperSlide key={it.id}>
                  <div className="group rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition">
                    <Link href={`/product/${it.id}`} className="block">
                      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                        <Image
                          src={it.image}
                          alt={it.title}
                          fill
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                          className="object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/product/${it.id}`} className="block">
                        <p className="text-sm font-semibold line-clamp-2 min-h-[40px]">
                          {it.title}
                        </p>
                      </Link>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-bold">{it.price} ₽</span>
                        <button
                          onClick={() => handleAdd(it.id, it.title, it.price, it.image, null, true)}
                          className="px-3 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition"
                          rel="nofollow"
                        >
                          В корзину
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}

              <button
                className="similarPrevMobile absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/70 transition z-10"
                aria-label="Назад"
              >
                <ChevronLeft className="text-white text-2xl" />
              </button>
              <button
                className="similarNextMobile absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/70 transition z-10"
                aria-label="Вперёд"
              >
                <ChevronRight className="text-white text-2xl" />
              </button>
            </Swiper>
          )}
        </motion.section>

        {/* MOBILE - допродажи */}
        <motion.section
          className="lg:hidden mt-6 pt-6 border-t"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-xl font-bold mb-4 tracking-tight">Добавьте к заказу</h2>

          {isLoadingRecommended ? (
            <p className="text-gray-500">Загрузка…</p>
          ) : recommendedItems.length === 0 ? (
            <p className="text-gray-500">Пока нет допов</p>
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
                }}
              >
                {recommendedItems.map((combo) => (
                  <SwiperSlide key={combo.id}>
                    <div className="group rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition">
                      <Link href={`/product/${combo.id}`} className="block">
                        <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                          <Image
                            src={combo.image}
                            alt={combo.title}
                            fill
                            placeholder="blur"
                            blurDataURL={BLUR_PLACEHOLDER}
                            className="object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      </Link>

                      <div className="p-3">
                        <Link href={`/product/${combo.id}`} className="block">
                          <p className="text-sm font-semibold line-clamp-2 min-h-[40px]">
                            {combo.title}
                          </p>
                        </Link>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="font-bold">{combo.price} ₽</span>
                          <button
                            onClick={() =>
                              handleAdd(combo.id, combo.title, combo.price, combo.image, null, true)
                            }
                            className="px-3 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition"
                            rel="nofollow"
                          >
                            В корзину
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                className="recommendSwiperButtonPrev absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/70 transition z-10"
                aria-label="Назад"
              >
                <ChevronLeft className="text-white text-2xl" />
              </button>
              <button
                className="recommendSwiperButtonNext absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/70 transition z-10"
                aria-label="Вперёд"
              >
                <ChevronRight className="text-white text-2xl" />
              </button>
            </div>
          )}
        </motion.section>

        {/* мобильная нижняя панель */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white px-3 py-3 lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none">{discountedPrice} ₽</span>
              <span className="text-[11px] text-gray-500 leading-none mt-1">+ бонус {bonus} ₽</span>
            </div>

            <div className="flex-1 ml-3 flex gap-2">
              <motion.button
                onClick={() =>
                  handleAdd(product.id, product.title, discountedPrice, images[0] || null, product.production_time ?? null)
                }
                className="flex-1 py-3 bg-black text-white rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-gray-800 transition"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Добавить в корзину"
                rel="nofollow"
              >
                В корзину
              </motion.button>

              <motion.button
                onClick={openCombo}
                className="flex-1 py-3 bg-white text-black border border-black rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-gray-50 transition"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                aria-label="Собрать комбо"
                rel="nofollow"
              >
                Комбо -10%
              </motion.button>
            </div>
          </div>
        </div>

        {/* -------------------------- COMBO MODAL -------------------------- */}
        <ComboBuilderModal
          open={comboOpen}
          view={comboView}
          onClose={closeCombo}
          onBackToMain={() => setComboView('main')}
          heroImage={images[0] || '/placeholder.jpg'}
          heroTitle="СОБЕРИ КОМБО И ПОЛУЧИ СКИДКУ ДО 10%"

          baseItem={baseSelectable}

          selSecondBase={selSecondBase}
          selBalloons={selBalloons}
          selCard={selCard}

          comboDiscountPercent={comboDiscountPercent}
          totalDiscountRub={comboTotals.discountRub}
          totalFinal={comboTotals.discountedSum}

          onPickSecondBase={() => startPick(isBerryProduct ? 'flowers' : 'berries')}
          onPickBalloons={() => startPick('balloons')}
          onPickCards={() => startPick('cards')}

          onReplaceSecondBase={() => startPick(selSecondBase?.kind || (isBerryProduct ? 'flowers' : 'berries'))}
          onReplaceBalloons={() => startPick('balloons')}
          onReplaceCards={() => startPick('cards')}

          onRemoveSecondBase={() => removeSelection(isBerryProduct ? 'flowers' : 'berries')}
          onRemoveBalloons={() => removeSelection('balloons')}
          onRemoveCards={() => removeSelection('cards')}

          pickTitle={pickTitle}
          pickTabs={pickTabs as any}
          activePick={activePick}
          onTabChange={onTabChange}
          loadingPick={loadingPick}
          pickError={pickError}
          pickList={pickList}
          onSelectPick={selectItem}

          onAddComboToCart={addComboToCart}
          isBerryBase={isBerryProduct}
        />
      </div>
    </section>
  );
}
