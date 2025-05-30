'use client';

import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';
import { CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  removeItem: (id: string) => void;
  updateQuantity?: (id: string, quantity: number) => void;
}

export default function CartItem({
  item,
  removeItem,
  updateQuantity,
}: CartItemProps) {
  const handleMinus = () => {
    if (updateQuantity && item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handlePlus = () => {
    if (updateQuantity) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const imageSrc = (item as any).imageUrl || (item as any).image_url || '/placeholder.jpg';

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-b-0">
      {/* Фото */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden border">
        <Image
          src={imageSrc}
          alt={item.title || "Фото товара"}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Название и цена в одну строку */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-sm font-medium text-black truncate max-w-[120px]">{item.title}</span>
          <span className="text-base font-semibold text-black whitespace-nowrap">{item.price.toLocaleString()} ₽</span>
        </div>
        {/* Контролы */}
        <div className="flex items-center justify-between mt-1">
          {updateQuantity && (
            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <button
                onClick={handleMinus}
                disabled={item.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition disabled:opacity-50"
                aria-label="Уменьшить количество"
                type="button"
              >
                <Minus size={18} />
              </button>
              <span className="px-3 text-base">{item.quantity}</span>
              <button
                onClick={handlePlus}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition"
                aria-label="Увеличить количество"
                type="button"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
          <button
            onClick={() => removeItem(item.id)}
            className="text-xs text-gray-400 hover:text-red-500 transition ml-2"
            aria-label="Удалить товар"
            type="button"
          >
            удалить
          </button>
        </div>
      </div>
    </div>
  );
}
