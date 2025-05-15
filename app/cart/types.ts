// Тип для товаров в корзине
export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  production_time?: number | null;
  isUpsell?: false;
}

// Тип для дополнительных товаров (upsell)
export interface UpsellItem {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  category?: 'postcard' | 'balloon';
  isUpsell: true;
  quantity: number; // Добавляем поле quantity
}

// Объединённый тип для товаров в корзине
export type CartItemType = CartItem | UpsellItem;
