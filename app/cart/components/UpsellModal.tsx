// ✅ Путь: app/cart/components/UpsellModal.tsx
'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { UpsellItem } from '../types';

interface Props {
  type: 'postcard' | 'balloon';
  onClose: () => void;
  onSelect: (item: UpsellItem) => void;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 минут

export default function UpsellModal({ type, onClose, onSelect }: Props) {
  // ✅ FIX: selectedId строго того же типа, что и UpsellItem.id (string или number)
  const [selectedId, setSelectedId] = useState<UpsellItem['id'] | null>(null);

  const [items, setItems] = useState<UpsellItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const title = useMemo(() => (type === 'postcard' ? 'Выберите открытку' : 'Выберите шары'), [type]);
  const subcategoryId = useMemo(() => (type === 'postcard' ? 171 : 173), [type]);

  useEffect(() => {
    // lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchItems = async () => {
      const cacheKey = `upsell_${type}_items_v1`;
      const cacheTimestampKey = `upsell_${type}_items_ts_v1`;

      setIsLoading(true);

      try {
        // 1) try cache
        const cached = localStorage.getItem(cacheKey);
        const tsRaw = localStorage.getItem(cacheTimestampKey);
        const ts = tsRaw ? Number(tsRaw) : 0;

        if (cached && ts && Date.now() - ts < CACHE_TTL_MS) {
          const parsed = JSON.parse(cached) as UpsellItem[];
          setItems(parsed);
          setIsLoading(false);
          return;
        }

        // 2) fetch
        const res = await fetch(`/api/upsell/products?category_id=8&subcategory_id=${subcategoryId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const { success, data, error } = await res.json();
        if (!success) {
          toast.error(error || 'Ошибка загрузки товаров');
          setItems([]);
          return;
        }

        // если у items уже есть category - оставим, иначе добавим
        const itemsWithCategory = (data || []).map((item: UpsellItem) => ({
          ...item,
          category: (item as any).category ?? (type as 'postcard' | 'balloon'),
        }));

        setItems(itemsWithCategory);

        localStorage.setItem(cacheKey, JSON.stringify(itemsWithCategory));
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
      } catch (err: any) {
        toast.error(err.message || 'Ошибка загрузки товаров');
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [type, subcategoryId]);

  const containerVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22 } },
    exit: { opacity: 0, y: 18, scale: 0.98, transition: { duration: 0.18 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upsell-modal-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="bg-white rounded-[26px] shadow-xl w-full max-w-xl relative border border-[#bdbdbd] overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-5 border-b border-[#e7e7e7] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Image src="/icons/gift.svg" alt="" width={18} height={18} />
              <h2
                id="upsell-modal-title"
                className="text-[15px] sm:text-[16px] font-bold tracking-tight uppercase"
              >
                {title}
              </h2>
            </div>

            <motion.button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#bdbdbd] w-10 h-10 flex items-center justify-center text-[#4b4b4b] hover:bg-[#4b4b4b] hover:text-white transition"
              aria-label="Закрыть"
              whileTap={{ scale: 0.98 }}
            >
              <Image src="/icons/times.svg" alt="" width={18} height={18} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="px-5 sm:px-6 py-5">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Image
                  src="/icons/spinner.svg"
                  alt="Загрузка"
                  width={32}
                  height={32}
                  className="animate-spin"
                />
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-[#8b8b8b] text-sm">Товары не найдены</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {items.map((item) => {
                  const isSelected = selectedId !== null && item.id === selectedId;

                  return (
                    <motion.button
                      key={String(item.id)}
                      type="button"
                      className={`text-left rounded-[16px] border p-2.5 cursor-pointer transition shadow-sm active:scale-[0.99] ${
                        isSelected ? 'border-black' : 'border-[#d7d7d7] hover:border-[#bdbdbd]'
                      }`}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => {
                        setSelectedId(item.id);
                        onSelect(item);
                        toast.success(`${item.title} добавлен в заказ`);

                        window.gtag?.('event', 'select_upsell_item', {
                          event_category: 'cartS',
                          item_id: item.id,
                          item_type: type,
                        });
                        if (YM_ID !== undefined) {
                          callYm(YM_ID, 'reachGoal', 'select_upsell_item', {
                            item_id: item.id,
                            item_type: type,
                          });
                        }

                        onClose();
                      }}
                      aria-label={`Выбрать ${item.title}`}
                    >
                      <div className="relative w-full overflow-hidden rounded-[12px] border border-[#efefef] bg-[#fafafa]">
                        <Image
                          src={(item as any).image_url ?? '/placeholder.jpg'}
                          alt={item.title}
                          width={420}
                          height={420}
                          className="w-full h-28 sm:h-32 object-cover"
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI/ANr6JCSbQAAAABJRU5ErkJggg=="
                          sizes="(max-width: 640px) 50vw, 33vw"
                          loading="lazy"
                        />
                      </div>

                      <div className="mt-2">
                        <p className="text-[13px] font-semibold leading-tight text-black line-clamp-2">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[12px] text-[#7b7b7b] font-semibold">
                          {item.price} ₽
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
