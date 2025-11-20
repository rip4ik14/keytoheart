// ✅ Путь: app/cart/components/CartItem.tsx
'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType & {
    isUpsell?: boolean;
    category?: string;
    imageUrl?: string;
    image_url?: string;
    image?: string;
    main_image?: string;
  };
  removeItem: (id: string) => void;
  updateQuantity?: (id: string, quantity: number) => void;
}

export default function CartItem({ item, removeItem, updateQuantity }: CartItemProps) {
  const isUpsell = !!item.isUpsell;

  const handleMinus = () => {
    if (!updateQuantity) return;
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  };

  const handlePlus = () => {
    if (!updateQuantity) return;
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  // 🔒 Максимально «устойчивый» источник картинки
  const imageSrc =
    item.imageUrl ||
    item.image_url ||
    item.image ||
    item.main_image ||
    (item as any).previewImage ||
    '/placeholder.jpg';

  return (
    <motion.div
      className="
        flex items-center gap-3 py-3 border-b last:border-b-0
        w-full
      "
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25 }}
    >
      {/* Фото товара */}
      <div
        className="
          relative flex-shrink-0 rounded-lg overflow-hidden border border-gray-200
          bg-gray-50
          w-16 h-16 xs:w-20 xs:h-20
        "
      >
        <Image
          src={imageSrc}
          alt={item.title || 'Фото товара'}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      {/* Контент справа */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Верхняя строка: название + цена */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs xs:text-sm font-medium text-black leading-snug break-words">
              {item.title}
            </p>

            {isUpsell && (
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-[2px] rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                <Gift size={11} />
                <span>Добавка к заказу</span>
              </div>
            )}
          </div>

          <span className="text-sm xs:text-base font-semibold text-black whitespace-nowrap">
            {item.price.toLocaleString()} ₽
          </span>
        </div>

        {/* Низ: количество + мусорка */}
        <div className="flex items-center justify-between mt-1">
          {updateQuantity && (
            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <motion.button
                type="button"
                onClick={handleMinus}
                disabled={item.quantity <= 1}
                className="
                  w-8 h-8 flex items-center justify-center text-gray-600 
                  hover:text-black transition disabled:opacity-40
                "
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Уменьшить количество"
              >
                <Minus size={16} />
              </motion.button>

              <span className="px-2 xs:px-3 text-sm xs:text-base select-none">
                {item.quantity}
              </span>

              <motion.button
                type="button"
                onClick={handlePlus}
                className="
                  w-8 h-8 flex items-center justify-center text-gray-600 
                  hover:text-black transition
                "
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Увеличить количество"
              >
                <Plus size={16} />
              </motion.button>
            </div>
          )}

          <motion.button
            type="button"
            onClick={handleRemove}
            className="text-gray-500 hover:text-red-500 transition ml-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Удалить товар из корзины"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
