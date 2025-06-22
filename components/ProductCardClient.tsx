'use client';

import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { ShoppingCart } from 'lucide-react';
import { useRef } from 'react';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

interface Props {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  productionTime: number | null;
}

export default function ProductCardClient({
  id,
  title,
  price,
  imageUrl,
  productionTime,
}: Props) {
  const { addItem } = useCart();
  const { triggerCartAnimation } = useCartAnimation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    // 1. Добавляем в корзину
    addItem({
      id: id.toString(),
      title,
      price,
      quantity: 1,
      imageUrl,
      production_time: productionTime,
    });

    // 2. Цель Яндекс.Метрики: add_to_cart
    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'add_to_cart');
    }

    // 3. Анимация полёта товара в корзину
    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      triggerCartAnimation(
        r.left + r.width / 2,
        r.top + r.height / 2,
        imageUrl
      );
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between border border-gray-300 rounded-lg overflow-hidden">
      {/* Содержимое карточки (изображение и текст) */}
      <div className="p-4">
        <img src={imageUrl} alt={title} className="w-full h-auto" />
        <div className="mt-2">
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-sm">{price}₽</p>
        </div>
      </div>
      {/* Кнопка "В корзину" фиксированная внизу */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-1.5 sm:gap-2 border-t border-gray-300 px-4 py-3 font-bold text-sm uppercase bg-white text-black transition-all duration-200 hover:bg-black hover:text-white active:scale-95"
        aria-label={`Добавить ${title} в корзину`}
      >
        <ShoppingCart size={19} /> В корзину
      </button>
    </div>
  );
}