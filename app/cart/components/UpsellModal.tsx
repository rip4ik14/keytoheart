'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { UpsellItem } from '../types';

interface Props {
  type: 'postcard' | 'balloon';
  onClose: () => void;
  onSelect: (item: UpsellItem) => void;
}

export default function UpsellModal({ type, onClose, onSelect }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<UpsellItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        // Изменяем subcategory, чтобы соответствовать значениям в базе
        const subcategory = type; // 'postcard' или 'balloon'
        const res = await fetch(
          `/api/upsell/categories?category=podarki&subcategories=${subcategory}`
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const { success, data, error } = await res.json();
        console.log('UpsellModal fetched data:', { success, data, error });
        if (!success) {
          console.error('UpsellModal fetch error:', error);
          toast.error(error || 'Ошибка загрузки товаров');
          return;
        }
        // Добавляем category к каждому элементу, так как он ожидается в CartSummary
        const itemsWithCategory = (data || []).map((item: UpsellItem) => ({
          ...item,
          category: type as 'postcard' | 'balloon',
        }));
        setItems(itemsWithCategory);
      } catch (err: any) {
        console.error('UpsellModal fetch error:', err);
        toast.error(err.message || 'Ошибка загрузки товаров');
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [type]);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upsell-modal-title"
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl relative"
          variants={containerVariants}
        >
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-label="Закрыть модальное окно"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Image src="/icons/times.svg" alt="Закрыть" width={24} height={24} />
          </motion.button>
          <div className="flex items-center justify-center gap-2 mb-6">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Image src="/icons/gift.svg" alt="Подарок" width={20} height={20} />
            </motion.div>
            <h2 id="upsell-modal-title" className="text-center text-xl font-bold tracking-tight">
              {type === 'postcard' ? 'Выберите открытку' : 'Выберите шары'}
            </h2>
          </div>

          {isLoading ? (
            <motion.div
              className="flex justify-center py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src="/icons/spinner.svg"
                alt="Загрузка"
                width={32}
                height={32}
                className="animate-spin"
              />
            </motion.div>
          ) : items.length === 0 ? (
            <motion.p
              className="text-center text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Товары не найдены
            </motion.p>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
              variants={containerVariants}
            >
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    onSelect(item);
                    onClose();
                    toast.success(`${item.title} добавлен в заказ`);
                    window.gtag?.('event', 'select_upsell_item', {
                      event_category: 'cart',
                      item_id: item.id,
                      item_type: type,
                    });
                    window.ym?.(12345678, 'reachGoal', 'select_upsell_item', {
                      item_id: item.id,
                      item_type: type,
                    });
                  }}
                  className={`rounded-xl border border-gray-200 p-2 cursor-pointer hover:shadow-md transition-all duration-300 ${
                    selectedId === item.id ? 'ring-2 ring-black' : ''
                  }`}
                  variants={itemVariants}
                  role="button"
                  aria-label={`Выбрать ${item.title}`}
                >
                  <Image
                    src={item.image_url ?? '/placeholder.jpg'}
                    alt={item.title}
                    width={300}
                    height={300}
                    className="w-full h-36 object-cover rounded mb-2"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI/ANr6JCSbQAAAABJRU5ErkJggg=="
                    sizes="(max-width: 640px) 50vw, 33vw"
                    loading="lazy"
                  />
                  <p className="text-sm font-semibold text-center text-black">{item.title}</p>
                  <p className="text-xs text-center text-gray-500">{item.price} ₽</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}