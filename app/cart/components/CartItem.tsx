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
        className="flex items-center gap-4 p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-16 h-16 flex-shrink-0">
          <Image
            src={imageSrc}
            alt="Фото товара"
            fill
            className="object-cover rounded-md"
          />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <p className="text-base font-bold text-gray-900">{item.price * item.quantity} ₽</p>
        </div>

        <div className="flex items-center gap-2">
          {updateQuantity && (
            <div className="flex items-center border rounded-md bg-gray-50">
              <motion.button
                onClick={handleMinus}
                disabled={item.quantity <= 1}
                aria-label="Уменьшить количество"
                className="w-8 h-8 hover:bg-gray-100 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Minus size={16} />
              </motion.button>
              <span className="px-2 text-sm font-medium">{item.quantity}</span>
              <motion.button
                onClick={handlePlus}
                aria-label="Увеличить количество"
                className="w-8 h-8 hover:bg-gray-100 rounded-r-md focus:outline-none focus:ring-2 focus:ring-black"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={16} />
              </motion.button>
            </div>
          )}

          <motion.button
            onClick={() => removeItem(item.id)}
            aria-label="Удалить товар"
            className="p-2 text-gray-400 hover:text-red-500 focus:outline-none"
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