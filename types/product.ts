// types/product.ts
import type { Database } from '@/lib/supabase/types_new';

// Определяем интерфейс Product на основе типа products из Supabase
export interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent?: number | null;
  original_price?: number | null;
  in_stock?: boolean | null;
  images: string[] | null;
  category?: string | null;
  subcategory_id?: number | null;
  // Дополнительные поля
  image_url?: string | null;
  created_at?: string | null;
  slug?: string | null;
  bonus?: number | null;
  short_desc?: string | null;
  description?: string | null;
  composition?: string | null;
  is_popular?: boolean | null;
  is_visible?: boolean | null;
  category_ids: number[]; // Заменяем category_id на category_ids
  production_time?: number | null; // Время изготовления в часах
}

// Тип ProductRow для использования при запросах к Supabase
export type ProductRow = Database['public']['Tables']['products']['Row'];