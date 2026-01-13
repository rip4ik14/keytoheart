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
  };
  removeItem: (id: string) => void;
  updateQuantity?: (id: string, quantity: number) => void;
}

function rub(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
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

  const handleMinus = () => {
    if (!updateQuantity) return;
    if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1);
    else removeItem(item.id);
  };

  const handlePlus = () => {
    if (!updateQuantity) return;
    updateQuantity(item.id, item.quantity + 1);
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
          <Image
            src={imageSrc}
            alt={item.title || 'Фото товара'}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-sm xs:text-base font-semibold leading-snug break-words ${ink}`}>
                {item.title}
              </p>

              {isUpsell ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.02] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-black/70">
                  <Gift size={12} />
                  <span>доп к заказу</span>
                </div>
              ) : null}
            </div>

            <div className="text-right">
              <div className={`text-base xs:text-lg font-semibold leading-none ${ink}`}>
                {rub(item.price)} ₽
              </div>
              <div className={`mt-1 text-[11px] ${muted}`}>за 1 шт</div>
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

                <span className={`px-3 text-sm xs:text-base font-semibold ${ink}`}>
                  {item.quantity}
                </span>

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
              <div className={`text-sm xs:text-base font-semibold ${ink}`}>
                {rub(item.price * item.quantity)} ₽
              </div>

              <motion.button
                type="button"
                onClick={() => removeItem(item.id)}
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
