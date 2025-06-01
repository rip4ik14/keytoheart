// ✅ Путь: app/cart/components/CartItem.tsx
'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItemType } from '../types';
import { motion } from 'framer-motion';

interface CartItemProps {
  item: CartItemType;
  removeItem: (id: string) => void;
  updateQuantity?: (id: string, quantity: number) => void;
}

export default function CartItem({
  item,
  removeItem,
  updateQuantity,
}: CartItemProps) {
  const handleMinus = () => {
    if (updateQuantity && item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else if (updateQuantity && item.quantity === 1) {
      // Если количество становится 0, удаляем товар
      removeItem(item.id);
    }
  };

  const handlePlus = () => {
    if (updateQuantity) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  const imageSrc = (item as any).imageUrl || (item as any).image_url || '/placeholder.jpg';

  return (
    <motion.div
      className="flex items-center gap-3 py-2 border-b last:border-b-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      {/* Фото */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden border">
        <Image
          src={imageSrc}
          alt={item.title || "Фото товара"}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Название и цена в одну строку */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-sm font-medium text-black truncate max-w-[120px]">{item.title}</span>
          <span className="text-base font-semibold text-black whitespace-nowrap">{item.price.toLocaleString()} ₽</span>
        </div>
        {/* Контролы */}
        <div className="flex items-center justify-between mt-1">
          {updateQuantity && (
            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <motion.button
                onClick={handleMinus}
                disabled={item.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Уменьшить количество"
                type="button"
              >
                <Minus size={18} />
              </motion.button>
              <span className="px-3 text-base">{item.quantity}</span>
              <motion.button
                onClick={handlePlus}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Увеличить количество"
                type="button"
              >
                <Plus size={18} />
              </motion.button>
            </div>
          )}
          <motion.button
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-500 transition ml-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Удалить товар из корзины"
            type="button"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}