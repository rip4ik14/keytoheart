'use client';

import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

import type { CartItemType, UpsellItem, CartItem } from '@/app/cart/types';
import UiButton from '@/components/ui/UiButton';

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
  deliveryMethod?: 'delivery' | 'pickup';

  promoCode: string;
  setPromoCode: Dispatch<SetStateAction<string>>;
  promoError?: string | null;
  onApplyPromo: () => Promise<void>;
}

function rub(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

function isUpsellItem(i: CartItemType): i is UpsellItem {
  return (i as UpsellItem).isUpsell === true;
}

function asCartItem(i: CartItemType): CartItem | null {
  return isUpsellItem(i) ? null : (i as CartItem);
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
  deliveryMethod = 'delivery',

  promoCode,
  setPromoCode,
  promoError = null,
  onApplyPromo,
}: CartSummaryProps) {
  const subtotal = useMemo(() => {
    return items.reduce((sum: number, i: CartItemType) => sum + (i.price || 0) * (i.quantity || 0), 0);
  }, [items]);

  const upsellTotal = useMemo(() => {
    return selectedUpsells.reduce(
      (sum: number, i: UpsellItem) => sum + (i.price || 0) * (i.quantity || 0),
      0,
    );
  }, [selectedUpsells]);

  const itemsDiscount = useMemo(() => {
    return items.reduce((sum: number, it: CartItemType) => {
      const ci = asCartItem(it);
      if (!ci) return sum;

      const base = typeof ci.base_price === 'number' && ci.base_price > 0 ? ci.base_price : null;
      if (!base) return sum;

      const perUnit = Math.max(0, base - (ci.price || 0));
      return sum + perUnit * (ci.quantity || 0);
    }, 0);
  }, [items]);

  const combinedDiscount = Math.round((discountAmount || 0) + itemsDiscount);

  const isPickup = deliveryMethod === 'pickup';
  const totalBeforeDiscounts = subtotal + upsellTotal + deliveryCost;

  const card = 'rounded-3xl border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)]';
  const muted = 'text-black/60';
  const ink = 'text-[#121212]';

  return (
    <motion.aside
      aria-label="Сумма заказа"
      className={`w-full p-4 xs:p-6 ${card}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-end justify-between gap-3">
        <h2 className={`text-base xs:text-lg font-semibold tracking-tight ${ink}`}>Итого</h2>

        {items.length + selectedUpsells.length > 0 ? (
          <span className={`text-[11px] xs:text-xs ${muted}`}>
            {items.length} {items.length === 1 ? 'товар' : 'товара'}
            {selectedUpsells.length ? ` + ${selectedUpsells.length} доп.` : ''}
          </span>
        ) : null}
      </div>

      {items.length + selectedUpsells.length === 0 ? (
        <p className={`mt-4 text-center ${muted}`}>Корзина пуста</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4 text-xs xs:text-sm">
          <div className="rounded-2xl border border-black/10 bg-black/[0.015] p-3 xs:p-4">
            <div className="flex justify-between">
              <span className={muted}>Товары</span>
              <span className={`font-semibold ${ink}`}>{rub(subtotal + upsellTotal)} ₽</span>
            </div>

            <div className="mt-2 flex justify-between gap-3">
              <span className={muted}>
                {isPickup ? 'Самовывоз из студии' : 'Доставка - менеджер рассчитает после оформления'}
              </span>
              <span className={`font-semibold ${ink}`}>{isPickup ? '0 ₽' : 'по расчету'}</span>
            </div>

            {combinedDiscount > 0 ? (
              <div className="mt-2 flex justify-between text-emerald-700">
                <span>Скидка</span>
                <span className="font-semibold">-{rub(combinedDiscount)} ₽</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-black/10 p-3 xs:p-4">
            <p className={`text-[11px] xs:text-xs font-semibold ${ink}`}>Промокод</p>

            <div className="mt-2 flex items-center gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Введите код"
                className="
                  w-full
                  rounded-2xl border border-black/10 bg-white
                  px-3 py-2 text-xs xs:text-sm
                  focus:outline-none focus:ring-2 focus:ring-black/10
                "
              />

              <UiButton
                type="button"
                onClick={onApplyPromo}
                variant="brand"
                className="
                  shrink-0
                  rounded-2xl
                  px-3 py-2
                  text-xs xs:text-sm
                  normal-case
                  shadow-[0_10px_25px_rgba(0,0,0,0.18)]
                "
              >
                ПРИМЕНИТЬ
              </UiButton>
            </div>

            {promoError ? <p className="mt-2 text-[11px] xs:text-xs text-red-600">{promoError}</p> : null}
          </div>

          {isAuthenticated && (
            <div className="rounded-2xl border border-black/10 p-3 xs:p-4">
              <div className="flex items-center justify-between gap-3">
                <label className={`flex items-center gap-2 text-xs xs:text-sm font-semibold ${ink}`}>
                  <input
                    type="checkbox"
                    checked={useBonuses}
                    onChange={(e) => setUseBonuses(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20"
                    disabled={bonusBalance <= 0 || totalBeforeDiscounts <= 0}
                    aria-label="Списать бонусы"
                  />
                  Списать бонусы
                </label>

                {useBonuses && bonusesUsed > 0 ? (
                  <span className="text-xs xs:text-sm font-semibold text-emerald-700">
                    -{rub(bonusesUsed)} ₽
                  </span>
                ) : null}
              </div>

              <p className={`mt-2 text-[11px] xs:text-xs ${muted}`}>
                {bonusBalance <= 0
                  ? 'Нет доступных бонусов'
                  : `Доступно: ${Math.min(bonusBalance, Math.floor(totalBeforeDiscounts * 0.15))} ₽`}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-black/10 p-3 xs:p-4">
            <span className={`text-[11px] xs:text-xs ${muted}`}>+ начислим {bonusAccrual} бонусов</span>
            <Image src="/icons/info-circle.svg" alt="Информация" width={16} height={16} loading="lazy" />
          </div>

          <div className="rounded-2xl border border-black/10 p-3 xs:p-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm xs:text-base font-semibold ${ink}`}>Итого</span>
              <span className={`text-lg xs:text-xl font-semibold tracking-tight ${ink}`}>
                {rub(finalTotal)} ₽
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}