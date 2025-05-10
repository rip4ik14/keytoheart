// ✅ Обновлённый компонент CartSummary.tsx — в стиле Labberry
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { UpsellItem } from '../types';

interface CartItemType {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartSummaryProps {
  items: CartItemType[];
  selectedUpsells: UpsellItem[];
  deliveryCost: number;
  bonusBalance: number;
  bonusAccrual: number;
  finalTotal: number;
  discountAmount: number;
  removeUpsell: (id: string) => void;
  isAuthenticated: boolean;
}

function CartSummary({
  items,
  selectedUpsells,
  deliveryCost,
  bonusBalance,
  bonusAccrual,
  finalTotal,
  discountAmount,
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
      <h2 className="mb-4 text-lg font-bold tracking-tight">Итого</h2>
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
        <motion.div
          className="mt-4 border-t pt-4 text-sm text-gray-600 space-y-2"
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
              <span>Скидка:</span>
              <span>-{discountAmount} ₽</span>
            </p>
          )}

          <div className="flex justify-between text-xs text-gray-400 items-center">
            <span>+ начислим {bonusAccrual} бонусов</span>
            <motion.span
              className="cursor-help"
              whileHover={{ scale: 1.1 }}
              title="Бонусы начисляются как 2.5% от суммы заказа после скидки"
            >
              <Image src="/icons/info-circle.svg" alt="Инфо" width={14} height={14} />
            </motion.span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mt-4 border text-sm font-bold text-black flex justify-between">
            <span>Итого:</span>
            <span>{finalTotal} ₽</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default React.memo(CartSummary);
