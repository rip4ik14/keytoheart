// ✅ Путь: app/cart/components/CartItem.tsx
'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType & {
    isUpsell?: boolean;
    category?: string;

    imageUrl?: string;
    image_url?: string;
    image?: string;
    main_image?: string;

    // скидки/комбо (могут прийти с разными именами)
    base_price?: number | null;
    basePrice?: number | null;

    discount_percent?: number | null;
    discountPercent?: number | null;

    discount_reason?: string | null;
    discountReason?: string | null;

    combo_id?: string | number | null;
    comboId?: string | number | null;

    combo_group_id?: string | number | null;
    comboGroupId?: string | number | null;

    // ✅ ВАЖНО: строковый ключ позиции (для удаления/кол-ва)
    line_id?: string;
  };

  // remove/update в контексте часто работают по line_id
  removeItem: (idOrLineId: string) => void;
  updateQuantity?: (idOrLineId: string, quantity: number) => void;
}

function rub(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

function getBasePrice(item: any): number | null {
  const v = item?.base_price ?? item?.basePrice ?? null;
  const n = v == null ? null : Number(v);
  return n && Number.isFinite(n) && n > 0 ? n : null;
}

function getDiscountPercent(item: any): number | null {
  const v = item?.discount_percent ?? item?.discountPercent ?? null;
  const n = v == null ? null : Number(v);
  return n && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function isComboItem(item: any): boolean {
  return (
    item?.discount_reason === 'combo' ||
    item?.discountReason === 'combo' ||
    item?.discount_reason === 'COMBO' ||
    item?.discountReason === 'COMBO' ||
    !!item?.combo_id ||
    !!item?.comboId ||
    !!item?.combo_group_id ||
    !!item?.comboGroupId
  );
}

export default function CartItem({ item, removeItem, updateQuantity }: CartItemProps) {
  const isUpsell = !!item.isUpsell;

  const imageSrc =
    item.imageUrl ||
    item.image_url ||
    item.image ||
    item.main_image ||
    (item as any).previewImage ||
    '/placeholder.jpg';

  const ink = 'text-[#121212]';
  const muted = 'text-black/60';

  const basePrice = getBasePrice(item);
  const discountPercent = getDiscountPercent(item);

  const hasDiscount = basePrice != null && basePrice > item.price;

  const unitDiscountRub = hasDiscount ? Math.max(0, basePrice! - item.price) : 0;

  const lineTotal = item.price * item.quantity;
  const lineBaseTotal = hasDiscount ? basePrice! * item.quantity : 0;

  const comboBadgeText = isComboItem(item) ? `комбо${discountPercent ? ` -${discountPercent}%` : ''}` : null;

  // ✅ Ключ строки в корзине: приоритет line_id
  const lineKey = (item as any).line_id ? String((item as any).line_id) : String(item.id);

  const handleMinus = () => {
    if (!updateQuantity) return;
    if (item.quantity > 1) updateQuantity(lineKey, item.quantity - 1);
    else removeItem(lineKey);
  };

  const handlePlus = () => {
    if (!updateQuantity) return;
    updateQuantity(lineKey, item.quantity + 1);
  };

  return (
    <motion.div
      className="
        w-full
        rounded-3xl border border-black/10 bg-white
        p-3 xs:p-4
        shadow-[0_10px_30px_rgba(0,0,0,0.05)]
      "
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-start gap-3">
        {/* image */}
        <div className="relative flex-shrink-0 w-20 h-20 xs:w-24 xs:h-24 rounded-2xl overflow-hidden border border-black/10 bg-black/[0.02]">
          <Image src={imageSrc} alt={item.title || 'Фото товара'} fill sizes="96px" className="object-cover" />
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-sm xs:text-base font-semibold leading-snug break-words ${ink}`}>{item.title}</p>

              {isUpsell ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.02] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-black/70">
                  <Gift size={12} />
                  <span>доп к заказу</span>
                </div>
              ) : null}
            </div>

            <div className="text-right">
              <div className="flex flex-col items-end gap-1">
                <div className={`text-base xs:text-lg font-semibold leading-none ${ink}`}>{rub(item.price)} ₽</div>

                {hasDiscount ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-black/45 line-through tabular-nums">{rub(basePrice!)} ₽</span>
                    <span className="text-[11px] font-semibold text-emerald-700 tabular-nums">
                      -{rub(unitDiscountRub)} ₽
                    </span>
                  </div>
                ) : null}

                <div className={`text-[11px] ${muted}`}>за 1 шт</div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {/* qty */}
            {updateQuantity ? (
              <div className="inline-flex items-center rounded-2xl border border-black/10 bg-black/[0.02] overflow-hidden">
                <motion.button
                  type="button"
                  onClick={handleMinus}
                  className="w-10 h-10 flex items-center justify-center text-black/60 hover:text-[#121212] transition"
                  whileTap={{ scale: 0.96 }}
                  aria-label="Уменьшить количество"
                >
                  <Minus size={18} />
                </motion.button>

                <span className={`px-3 text-sm xs:text-base font-semibold ${ink}`}>{item.quantity}</span>

                <motion.button
                  type="button"
                  onClick={handlePlus}
                  className="w-10 h-10 flex items-center justify-center text-black/60 hover:text-[#121212] transition"
                  whileTap={{ scale: 0.96 }}
                  aria-label="Увеличить количество"
                >
                  <Plus size={18} />
                </motion.button>
              </div>
            ) : (
              <div className={`text-sm ${muted}`}>Кол-во: {item.quantity}</div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end leading-none">
                <div className="flex items-center gap-2">
                  <span className={`text-sm xs:text-base font-semibold ${ink}`}>{rub(lineTotal)} ₽</span>

                  {comboBadgeText ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black text-white whitespace-nowrap">
                      {comboBadgeText}
                    </span>
                  ) : null}
                </div>

                {hasDiscount ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] text-black/45 line-through tabular-nums">{rub(lineBaseTotal)} ₽</span>
                    <span className="text-[11px] font-semibold text-emerald-700 tabular-nums">
                      -{rub(lineBaseTotal - lineTotal)} ₽
                    </span>
                  </div>
                ) : null}
              </div>

              <motion.button
                type="button"
                onClick={() => removeItem(lineKey)}
                className="w-10 h-10 rounded-2xl border border-black/10 bg-white hover:bg-black/[0.02] transition flex items-center justify-center"
                whileTap={{ scale: 0.96 }}
                aria-label="Удалить"
              >
                <Trash2 size={18} className="text-black/70" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}