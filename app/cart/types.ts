// ✅ Путь: app/cart/types.ts

// Строка корзины (обычный товар)
export interface CartItem {
  // ✅ уникальный id строки корзины (главный ключ для удаления/кол-ва)
  line_id: string;

  // id товара
  id: string;
  title: string;

  // ✅ финальная цена за 1 шт (уже со скидкой, если есть)
  price: number;

  quantity: number;
  imageUrl?: string;
  production_time?: number | null;

  // ✅ скидочные поля (опционально)
  base_price?: number | null; // оригинальная цена до скидки
  discount_percent?: number | null; // например 10
  discount_reason?: 'combo' | 'promo' | 'manual' | null;

  // ✅ для связи позиций в набор
  combo_id?: string | null;

  isUpsell?: false;
}

// Доп. товар (upsell) - тоже строка корзины
export interface UpsellItem {
  line_id: string;

  id: string;
  title: string;
  price: number;

  image_url?: string;
  category?: 'postcard' | 'balloon';

  isUpsell: true;
  quantity: number;
}

// Объединённый тип
export type CartItemType = CartItem | UpsellItem;