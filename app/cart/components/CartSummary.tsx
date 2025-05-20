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
}: CartSummaryProps) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const upsellTotal = selectedUpsells.reduce((sum, i) => sum + (i.price || 0), 0);
  const totalBeforeDiscounts = subtotal + upsellTotal + deliveryCost;

  return (
    <motion.aside
      aria-label="Сумма заказа"
      className="w-full lg:w-80 p-6 bg-white rounded-3xl shadow-lg border border-gray-100 sticky top-6"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Итого</h2>

      {items.length + selectedUpsells.length === 0 ? (
        <p className="text-center text-gray-500">Корзина пуста</p>
      ) : (
        <>
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
            {isAuthenticated && bonusBalance > 0 && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useBonuses}
                    onChange={(e) => setUseBonuses(e.target.checked)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  Списать бонусы
                </label>
                {useBonuses && <span className="text-green-600">-{bonusesUsed} ₽</span>}
              </div>
            )}
            {isAuthenticated && bonusBalance > 0 && !useBonuses && (
              <p className="pt-1 text-xs text-gray-400">
                Доступно для списания: {Math.min(bonusBalance, Math.floor(totalBeforeDiscounts * 0.15))} ₽
              </p>
            )}
            <div className="flex justify-between items-center pt-2 text-xs text-gray-400">
              <span>+ начислим {bonusAccrual} бонусов</span>
              <motion.span title="Бонусы начисляются как 2.5% от суммы заказа">
                <Image src="/icons/info-circle.svg" alt="ℹ" width={14} height={14} />
              </motion.span>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center text-lg font-bold text-gray-900">
            <span>Итого</span>
            <span>{finalTotal} ₽</span>
          </div>
        </>
      )}
    </motion.aside>
  );
});
