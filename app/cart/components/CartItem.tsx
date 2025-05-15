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
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200 rounded-2xl p-4 bg-white shadow-sm mb-4 hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
        role="listitem"
        aria-label={`Товар ${item.title} в корзине`}
      >
        <div className="flex items-start sm:items-center gap-4 w-full">
          <Image
            src={imageSrc}
            alt={item.title}
            width={100}
            height={100}
            className="rounded-xl object-cover shadow-sm hover:shadow-md transition w-24 h-24 sm:w-32 sm:h-32"
          />
          <div className="flex flex-col gap-1 flex-grow">
            <span className="text-sm sm:text-base font-medium text-gray-900 leading-tight">{item.title}</span>
            {'production_time' in item && (
              <span className="text-xs text-gray-500">
                Изготовление: {item.production_time} ч.
              </span>
            )}
            <div className="flex items-center gap-2 mt-2 sm:hidden">
              {'quantity' in item ? (
                <div className="flex items-center gap-1 border rounded-lg bg-gray-50">
                  <motion.button
                    onClick={handleMinus}
                    className="p-1 rounded-l-lg hover:bg-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                    disabled={item.quantity <= 1}
                    aria-label={`Уменьшить количество ${item.title}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image src="/icons/minus.svg" alt="Уменьшить" width={16} height={16} />
                  </motion.button>
                  <span className="px-2 text-sm font-medium">{item.quantity}</span>
                  <motion.button
                    onClick={handlePlus}
                    className="p-1 rounded-r-lg hover:bg-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    aria-label={`Увеличить количество ${item.title}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image src="/icons/plus.svg" alt="Увеличить" width={16} height={16} />
                  </motion.button>
                </div>
              ) : (
                <span className="px-2 text-sm font-medium">1</span>
              )}
              <span className="text-sm font-semibold text-gray-800">
                {item.price * ('quantity' in item ? item.quantity : 1)} ₽
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="hidden sm:flex items-center gap-2">
            {'quantity' in item ? (
              <div className="flex items-center gap-1 border rounded-lg bg-gray-50">
                <motion.button
                  onClick={handleMinus}
                  className="p-1 rounded-l-lg hover:bg-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                  disabled={item.quantity <= 1}
                  aria-label={`Уменьшить количество ${item.title}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image src="/icons/minus.svg" alt="Уменьшить" width={16} height={16} />
                </motion.button>
                <span className="px-2 text-sm font-medium">{item.quantity}</span>
                <motion.button
                  onClick={handlePlus}
                  className="p-1 rounded-r-lg hover:bg-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  aria-label={`Увеличить количество ${item.title}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image src="/icons/plus.svg" alt="Увеличить" width={16} height={16} />
                </motion.button>
              </div>
            ) : (
              <span className="px-2 text-sm font-medium">1</span>
            )}
            <span className="text-sm font-semibold text-gray-800">
              {item.price * ('quantity' in item ? item.quantity : 1)} ₽
            </span>
          </div>
          <motion.button
            onClick={() => removeItem(item.id)}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition"
            aria-label={`Удалить ${item.title} из корзины`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image src="/icons/trash.svg" alt="Удалить" width={16} height={16} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}