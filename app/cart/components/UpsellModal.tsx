// ✅ Путь: app/cart/components/UpsellModal.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@context/CartContext';

interface Props {
  type: 'postcard' | 'balloon';
  onClose: () => void;
}

const items = {
  postcard: [
    { id: 101, title: 'Открытка #1', price: 150, imageUrl: '/postcard1.jpg' },
    { id: 102, title: 'Открытка #2', price: 150, imageUrl: '/postcard2.jpg' },
  ],
  balloon: [
    { id: 201, title: 'Шар #1', price: 300, imageUrl: '/balloon1.jpg' },
    { id: 202, title: 'Шар #2', price: 350, imageUrl: '/balloon2.jpg' },
  ],
};

export default function UpsellModal({ type, onClose }: Props) {
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl relative"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl"
          >
            &times;
          </button>
          <h2 className="text-center text-xl font-bold mb-6">
            {type === 'postcard' ? 'Выберите открытку' : 'Выберите шары'}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {items[type].map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`rounded-xl border p-2 cursor-pointer hover:shadow ${
                  selectedId === item.id ? 'ring-2 ring-black' : ''
                }`}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={300}
                  height={300}
                  className="w-full h-36 object-cover rounded mb-2"
                />
                <p className="text-sm font-semibold text-center">{item.title}</p>
                <p className="text-xs text-center text-gray-500">{item.price} ₽</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="border px-5 py-2 rounded text-sm hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={() => {
                if (selectedId) {
                  const selected = items[type].find((i) => i.id === selectedId);
                  if (selected) {
                    addItem({ ...selected, quantity: 1 });
                  }
                }
                onClose();
              }}
              disabled={selectedId === null}
              className="bg-black text-white px-5 py-2 rounded text-sm disabled:opacity-50"
            >
              Добавить
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
