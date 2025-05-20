// ✅ Путь: components/CartItem.tsx
'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  removeItem: (id: string) => void;
  updateQuantity?: (id: string, quantity: number) => void;
}

export default function CartItem({ item, removeItem, updateQuantity }: CartItemProps) {
  const handleMinus = () => {
    if ('quantity' in item && item.quantity > 1 && updateQuantity) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handlePlus = () => {
    if ('quantity' in item && updateQuantity) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const imageSrc =
    'imageUrl' in item && item.imageUrl
      ? item.imageUrl
      : 'image_url' in item && item.image_url
      ? item.image_url
      : '/placeholder.jpg';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={item.id}
        role="listitem"
        aria-label={`Товар ${item.title} в корзине`}
        className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white rounded-3xl shadow-lg mb-6 hover:shadow-xl transition-shadow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-6 w-full">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
            <Image
              src={imageSrc}
              alt={item.title}
              fill
              className="object-cover rounded-2xl"
            />
          </div>
          <div className="flex flex-col flex-grow gap-1">
            <span className="text-base sm:text-lg font-semibold text-gray-900">{item.title}</span>
            {'production_time' in item && (
              <span className="text-sm text-gray-500">Изготовление: {item.production_time} ч.</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {'quantity' in item && updateQuantity && (
            <div className="flex items-center gap-2 border rounded-lg bg-gray-50">
              <motion.button
                onClick={handleMinus}
                disabled={item.quantity <= 1}
                aria-label={`Уменьшить количество ${item.title}`}
                className="p-2 hover:bg-gray-100 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image src="/icons/minus.svg" alt="–" width={16} height={16} />
              </motion.button>
              <span className="px-3 text-base font-medium">{item.quantity}</span>
              <motion.button
                onClick={handlePlus}
                aria-label={`Увеличить количество ${item.title}`}
                className="p-2 hover:bg-gray-100 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image src="/icons/plus.svg" alt="+" width={16} height={16} />
              </motion.button>
            </div>
          )}
          <span className="text-lg font-bold text-gray-900">
            {item.price * ('quantity' in item ? item.quantity : 1)} ₽
          </span>
          <motion.button
            onClick={() => removeItem(item.id)}
            aria-label={`Удалить ${item.title} из корзины`}
            className="p-2 text-gray-400 hover:text-red-500 transition focus:outline-none"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Image src="/icons/trash.svg" alt="🗑" width={16} height={16} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
