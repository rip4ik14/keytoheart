// ✅ Путь: app/cart/components/CartItem.tsx
'use client';

import Image from 'next/image';
import { useCart } from '@context/CartContext';

interface CartItemProps {
  item: {
    id: number;
    title: string;
    price: number;
    quantity: number;
    imageUrl: string;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  // Уменьшение кол-ва на 1
  const handleMinus = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      // Если при кол-ве 1 жмут минус, можно либо оставить 1,
      // либо удалить товар полностью. По умолчанию - не удаляем.
      // Если хочешь удалять - раскомментируй:
      // removeItem(item.id);
    }
  };

  // Увеличение кол-ва на 1
  const handlePlus = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div className="border rounded-xl p-4 flex gap-4 items-center mb-4 bg-white shadow-sm">
      <Image
        src={item.imageUrl}
        alt={item.title}
        width={80}
        height={80}
        className="rounded object-cover"
      />
      <div className="flex-1">
        <p className="font-medium text-sm md:text-base">{item.title}</p>
        <p className="text-xs md:text-sm text-gray-500">
          {item.price} ₽ за штуку
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleMinus}
            className="border px-2 rounded hover:bg-gray-100 text-sm"
          >
            –
          </button>
          <span className="mx-1 font-medium">
            {item.quantity}
          </span>
          <button
            onClick={handlePlus}
            className="border px-2 rounded hover:bg-gray-100 text-sm"
          >
            +
          </button>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">
          {item.price * item.quantity} ₽
        </p>
        <button
          onClick={() => removeItem(item.id)}
          className="mt-1 text-xs text-red-500 hover:underline"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
