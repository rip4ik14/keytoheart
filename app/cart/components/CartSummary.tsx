// ✅ Путь: components/CartSummary.tsx
'use client';

import React, { Dispatch, SetStateAction } from 'react';
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
  useBonuses: boolean;
  setUseBonuses: Dispatch<SetStateAction<boolean>>;
  bonusesUsed: number;
}

function CartSummary({
  items,
  selectedUpsells,
  deliveryCost,
  bonusBalance,
  bonusAccrual,
  finalTotal,
  discountAmount,
  removeUpsell,
  isAuthenticated,
  useBonuses,
  setUseBonuses,
  bonusesUsed,
}: CartSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const upsellTotal = selectedUpsells.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalBeforeDiscounts = subtotal + upsellTotal + deliveryCost;

  return (
    <motion.div
      className="h-fit self-start rounded-2xl bg-white p-4 sm:p-6 shadow-lg border border-gray-200 w-full lg:w-auto lg:sticky lg:top-4"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      aria-label="Сумма заказа"
    >
      <h2 className="mb-4 text-lg sm:text-xl font-bold tracking-tight">Итого</h2>
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
          className="mt-4 border-t pt-4 text-sm text-gray-600 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="flex justify-between">
            <span>Товары:</span>
            <span className="font-medium">{subtotal + upsellTotal} ₽</span>
          </p>
          <p className="flex justify-between">
            <span>Доставка:</span>
            <span className="font-medium">{deliveryCost} ₽</span>
          </p>
          {discountAmount > 0 && (
            <p className="flex justify-between text-green-600">
              <span>Скидка:</span>
              <span>-{discountAmount} ₽</span>
            </p>
          )}
          {isAuthenticated && bonusBalance > 0 && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useBonuses}
                  onChange={(e) => setUseBonuses(e.target.checked)}
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <span>Списать бонусы</span>
              </label>
              {useBonuses && (
                <span className="text-green-600">-{bonusesUsed} ₽</span>
              )}
            </div>
          )}
          {isAuthenticated && bonusBalance > 0 && !useBonuses && (
            <p className="text-xs text-gray-500">
              Доступно для списания: {Math.min(bonusBalance, Math.floor(totalBeforeDiscounts * 0.15))} ₽
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