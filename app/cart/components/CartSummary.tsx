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
  /** Если true — скрывает чекбокс бонусов */
  hideBonusOption?: boolean;
}

export default React.memo(function CartSummary({
  items,
  selectedUpsells,
  deliveryCost,
  bonusBalance,
  bonusAccrual,
  finalTotal,
  discountAmount,
  isAuthenticated,
  useBonuses,
  setUseBonuses,
  bonusesUsed,
  hideBonusOption = false,
}: CartSummaryProps) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const upsellTotal = selectedUpsells.reduce((sum, i) => sum + (i.price || 0), 0);
  const totalBeforeDiscounts = subtotal + upsellTotal + deliveryCost;

  return (
    <motion.aside
      aria-label="Сумма заказа"
      className="w-full lg:w-80 p-6 bg-white rounded-3xl shadow-xl border border-gray-200 sticky top-6"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="mb-6 text-2xl font-semibold text-gray-900">Итого</h2>

      {items.length + selectedUpsells.length === 0 ? (
        <p className="text-center text-gray-500">Корзина пуста</p>
      ) : (
        <div className="space-y-4 divide-y divide-gray-100 text-gray-700 text-sm">
          <div className="flex justify-between">
            <span>Товары</span>
            <span className="font-medium">{subtotal + upsellTotal} ₽</span>
          </div>

          <div className="flex justify-between">
            <span>Доставка</span>
            <span className="font-medium">{deliveryCost} ₽</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Скидка</span>
              <span>-{discountAmount} ₽</span>
            </div>
          )}

          {/* Блок бонусов */}
          {!hideBonusOption && isAuthenticated && bonusBalance > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <label className="flex items-center gap-2 text-base text-gray-800">
                  <input
                    type="checkbox"
                    checked={useBonuses}
                    onChange={(e) => setUseBonuses(e.target.checked)}
                    className="h-5 w-5 text-black focus:ring-black border-gray-300 rounded"
                  />
                  Списать бонусы
                </label>
                {useBonuses && (
                  <span className="text-lg font-semibold text-green-600">−{bonusesUsed} ₽</span>
                )}
              </div>
              {!useBonuses && (
                <p className="mt-2 text-xs text-gray-500">
                  Доступно для списания: {Math.min(bonusBalance, Math.floor(totalBeforeDiscounts * 0.15))} ₽
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 text-xs text-gray-400">
            <span>+ начислим {bonusAccrual} бонусов</span>
            <motion.span title="2.5% от итоговой суммы">
              <Image src="/icons/info-circle.svg" alt="ℹ" width={16} height={16} />
            </motion.span>
          </div>

          <div className="mt-6 flex justify-between items-center text-2xl font-bold text-gray-900">
            <span>Итого</span>
            <span>{finalTotal} ₽</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
});
