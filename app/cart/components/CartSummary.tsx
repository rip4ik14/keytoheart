'use client';

import { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CartItemType, UpsellItem } from '../types';

interface CartSummaryProps {
  items: CartItemType[];
  selectedUpsells: UpsellItem[];
  deliveryCost: number;
  bonusBalance: number;
  bonusAccrual: number;
  finalTotal: number;
  discountAmount: number;
  removeUpsell: (id: string) => void;
  isAuthenticated: boolean; // Добавлено
  useBonuses: boolean;
  setUseBonuses: Dispatch<SetStateAction<boolean>>;
  bonusesUsed: number;
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
  useBonuses,
  setUseBonuses,
  bonusesUsed,
}: CartSummaryProps) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const upsellTotal = selectedUpsells.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
  const totalBeforeDiscounts = subtotal + upsellTotal + deliveryCost;

  return (
    <motion.aside
      aria-label="Сумма заказа"
      className="w-full p-6 bg-white rounded-3xl shadow-lg border border-gray-200"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="mb-4 text-xl font-bold text-gray-900">Итого</h2>

      {items.length + selectedUpsells.length === 0 ? (
        <p className="text-center text-gray-500">Корзина пуста</p>
      ) : (
        <div className="flex flex-col space-y-4 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Товары</span>
            <span className="font-medium">{subtotal + upsellTotal} ₽</span>
          </div>
          <div className="flex justify-between">
            <span>Доставка</span>
            <span className="font-medium">{deliveryCost} ₽</span>
          </div>
          {discountAmount > 0 && (
            <motion.div
              className="flex justify-between text-green-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span>Скидка</span>
              <span>-{discountAmount} ₽</span>
            </motion.div>
          )}

          {isAuthenticated && bonusBalance > 0 && (
            <motion.div
              className="pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <label className="flex items-center gap-2 text-base font-medium text-gray-900">
                  <input
                    type="checkbox"
                    checked={useBonuses}
                    onChange={(e) => setUseBonuses(e.target.checked)}
                    className="h-5 w-5 text-black border-gray-300 rounded focus:ring-black"
                    aria-label="Списать бонусы"
                  />
                  Списать бонусы
                </label>
                {useBonuses && (
                  <motion.span
                    className="text-lg font-semibold text-green-600"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    −{bonusesUsed} ₽
                  </motion.span>
                )}
              </div>
              {!useBonuses && (
                <p className="mt-2 text-xs text-gray-500">
                  Доступно: {Math.min(bonusBalance, Math.floor(totalBeforeDiscounts * 0.15))} ₽
                </p>
              )}
            </motion.div>
          )}

          <div className="flex justify-between items-center pt-4 text-xs text-gray-400">
            <span>+ начислим {bonusAccrual} бонусов</span>
            <Image
              src="/icons/info-circle.svg"
              alt="Информация"
              width={16}
              height={16}
              loading="lazy"
            />
          </div>

          <div className="mt-6 flex justify-between items-center text-lg font-bold text-gray-900">
            <span>Итого</span>
            <span>{finalTotal} ₽</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}