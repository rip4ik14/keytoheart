'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItemType } from '../types';

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
    }
  };

  const handlePlus = () => {
    if (updateQuantity) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const imageSrc = (item as any).imageUrl || (item as any).image_url || '/placeholder.jpg';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={item.id}
        role="listitem"
        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
      >
        {/* Картинка */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
          <Image
            src={imageSrc}
            alt="Фото товара"
            fill
            className="object-cover rounded-2xl"
          />
        </div>

        {/* Кол-во + Цена + Удалить */}
        <div className="flex items-center gap-3 w-full justify-between sm:justify-end flex-wrap sm:flex-nowrap">
          {updateQuantity && (
            <div className="flex items-center border rounded-lg bg-gray-50 flex-shrink-0">
              <motion.button
                onClick={handleMinus}
                disabled={item.quantity <= 1}
                aria-label="Уменьшить количество"
                className="p-2 hover:bg-gray-100 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Minus size={16} />
              </motion.button>
              <span className="px-3 text-base font-medium">{item.quantity}</span>
              <motion.button
                onClick={handlePlus}
                aria-label="Увеличить количество"
                className="p-2 hover:bg-gray-100 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={16} />
              </motion.button>
            </div>
          )}

          <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
            {item.price * item.quantity} ₽
          </span>

          <motion.button
            onClick={() => removeItem(item.id)}
            aria-label="Удалить товар"
            className="p-2 text-gray-400 hover:text-red-500 focus:outline-none flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
