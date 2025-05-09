'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { UpsellItem as UpsellItemType } from '../page'; // Импортируем UpsellItem из CartPage

// Тип для товаров в корзине
interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartSummaryProps {
  items: CartItem[];
  selectedUpsells: UpsellItemType[]; // Используем импортированный тип
  deliveryCost: number;
  bonusBalance: number;
  bonusAccrual: number;
  finalTotal: number;
  discountAmount: number;
  removeUpsell: (id: string) => void;
  isAuthenticated: boolean;
}

export default function CartSummary({
  items,
  selectedUpsells,
  deliveryCost,
  bonusBalance,
  bonusAccrual,
  finalTotal,
  discountAmount,
  removeUpsell,
  isAuthenticated,
}: CartSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const upsellTotal = selectedUpsells.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalBeforeDiscounts = subtotal + upsellTotal + deliveryCost;

  return (
    <motion.div
      className="h-fit self-start rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      aria-label="Сумма заказа"
    >
      <h2 className="mb-4 text-lg font-bold tracking-tight">Товары</h2>
      {items.length === 0 && selectedUpsells.length === 0 ? (
        <motion.p
          className="text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Корзина пуста
        </motion.p>
      ) : (
        <div className="space-y-4">
          {selectedUpsells.map((item, idx) => (
            <motion.div
              key={`upsell-${item.id}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (items.length + idx) * 0.1 }}
              className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={item.image_url ?? '/placeholder.jpg'}
                  alt={item.title}
                  width={40}
                  height={40}
                  className="rounded object-cover"
                  loading="lazy"
                  sizes="40px"
                />
                <span className="text-sm md:text-base font-medium text-gray-800">{item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{item.price} ₽</span>
                <motion.button
                  onClick={() => removeUpsell(item.id)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  aria-label={`Удалить ${item.title} из корзины`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image src="/icons/trash.svg" alt="Удалить" width={16} height={16} />
                </motion.button>
              </div>
            </motion.div>
          ))}
          <motion.div
            className="mt-4 border-t pt-4 text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="flex justify-between">
              <span>Товары:</span>
              <span>{subtotal + upsellTotal} ₽</span>
            </p>
            <p className="flex justify-between">
              <span>Доставка:</span>
              <span>{deliveryCost} ₽</span>
            </p>
            {discountAmount > 0 && (
              <p className="flex justify-between text-black">
                <span>Скидка по промокоду:</span>
                <span>-{discountAmount} ₽</span>
              </p>
            )}
            <div className="flex items-center gap-1">
              <p className="flex justify-between w-full text-xs text-gray-400">
                <span>+ {bonusAccrual} бонусов</span>
                <motion.span
                  className="text-xs text-gray-400 cursor-help"
                  whileHover={{ scale: 1.1 }}
                  title="Бонусы начисляются как 2.5% от суммы заказа после скидок"
                >
                  <Image src="/icons/info-circle.svg" alt="Информация" width={14} height={14} />
                </motion.span>
              </p>
            </div>
            <p className="mt-2 flex justify-between font-bold text-black">
              <span>Итого:</span>
              <span>{finalTotal} ₽</span>
            </p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}