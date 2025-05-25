// utils/repeatOrder.ts

import { Order } from '@/types/order';

// Возвращает массив товаров для добавления в корзину
export async function repeatOrder(order: Order) {
  // Маппим только items (не upsell, если не нужно)
  return [
    ...order.items.map((item) => ({
      id: item.product_id.toString(),
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      imageUrl: '', // Если надо — добавь сюда картинку из своей структуры
    })),
    ...order.upsell_details.map((upsell) => ({
      id: `upsell-${upsell.title}-${upsell.category}`,
      title: upsell.title,
      price: upsell.price,
      quantity: upsell.quantity,
      imageUrl: '', // Если надо
      isUpsell: true,
    })),
  ];
}
