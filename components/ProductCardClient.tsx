// ✅ Путь: components/ProductCardClient.tsx
'use client';

import { useCart } from '@context/CartContext';
import { useCartAnimation } from '@context/CartAnimationContext';
import { ShoppingCart } from 'lucide-react';
import { useRef } from 'react';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import Image from 'next/image';

interface Props {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  productionTime: number | null;
}

export default function ProductCardClient({ id, title, price, imageUrl, productionTime }: Props) {
  const { addItem } = useCart();
  const { triggerCartAnimation } = useCartAnimation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    // ✅ FIX: line_id обязателен в CartItem (по CartContext.tsx)
    // обычный товар - стабильный line_id
    const line_id = `product:${id}`;

    addItem({
      line_id,
      id: id.toString(),
      title,
      price,
      quantity: 1,
      imageUrl,
      production_time: productionTime,
    });

    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'add_to_cart');
    }

    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      triggerCartAnimation(r.left + r.width / 2, r.top + r.height / 2, imageUrl);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Верхняя часть: картинка + контентная колонка */}
      <div className="p-4 pb-0 flex flex-col flex-1">
        <div className="relative w-full aspect-[3/4] rounded-[12px] overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            width={220}
            height={293}
            sizes="(max-width:640px) 100vw, 220px"
            className="object-cover w-full h-full rounded-[12px]"
            placeholder="blur"
            blurDataURL="/placeholder-blur.png"
            priority={false}
          />
        </div>

        {/* Контентная колонка: заголовок -> (spacer) -> цена -> время */}
        <div className="mt-2 flex flex-col flex-1">
          {/* Фиксируем высоту заголовка (3 строки) и обрезаем многоточием */}
          <h3
            className="text-sm font-bold leading-5"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3, // можно 2, если так в макете
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '3.75rem', // 3 строки * 1.25rem (leading-5)
            }}
            title={title}
          >
            {title}
          </h3>

          {/* spacer тянет колонку, прижимая мета-блок к низу */}
          <div className="mt-auto" />

          {/* Мета-блок - ВСЕГДА непосредственно над кнопкой */}
          <div className="mt-2">
            <p className="text-sm font-semibold">{price}₽</p>
            {typeof productionTime === 'number' && (
              <p className="text-xs text-gray-500">
                Время изготовления: {productionTime} час{productionTime === 1 ? '' : 'а'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Кнопка всегда в самом низу карточки */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-1.5 sm:gap-2 border-t border-gray-300 px-4 py-3 font-bold text-sm uppercase bg-white text-black transition-all duration-200 hover:bg-black hover:text-white active:scale-95"
        aria-label={`Добавить ${title} в корзину`}
        style={{ minHeight: 44 }}
      >
        <ShoppingCart size={19} /> В корзину
      </button>
    </div>
  );
}