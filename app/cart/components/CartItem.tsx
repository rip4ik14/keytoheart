// ✅ Путь: app/cart/components/CartItem.tsx
'use client';

import Image from 'next/image';
import { useCart } from '@context/CartContext';

interface CartItemProps {
  item: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    imageUrl: string;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  const handleMinus = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handlePlus = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div
      className="border rounded-xl p-4 flex gap-4 items-center mb-4 bg-white shadow-sm"
      role="listitem"
      aria-label={`Товар ${item.title} в корзине`}
    >
      <Image
        src={item.imageUrl}
        alt={item.title}
        width={80}
        height={80}
        className="rounded object-cover"
        loading="lazy"
        sizes="80px"
      />
      <div className="flex-1">
        <p className="font-medium text-sm md:text-base">{item.title}</p>
        <p className="text-xs md:text-sm text-gray-500">
          {item.price} ₽ за штуку
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleMinus}
            className="border px-2 rounded hover:bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            disabled={item.quantity <= 1}
            aria-label={`Уменьшить количество ${item.title}`}
          >
            –
          </button>
          <span className="mx-1 font-medium">{item.quantity}</span>
          <button
            onClick={handlePlus}
            className="border px-2 rounded hover:bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            aria-label={`Увеличить количество ${item.title}`}
          >
            +
          </button>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{item.price * item.quantity} ₽</p>
        <button
          onClick={() => {
            removeItem(item.id);
            window.gtag?.('event', 'remove_cart_item', {
              event_category: 'cart',
              item_id: item.id,
            });
            window.ym?.(12345678, 'reachGoal', 'remove_cart_item', { item_id: item.id });
          }}
          className="mt-1 text-xs text-black hover:underline focus:outline-none focus:ring-2 focus:ring-black"
          aria-label={`Удалить ${item.title} из корзины`}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}