// ✅ Путь: types/product.ts
import type { Database } from '@/lib/supabase/types_new';

export interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent?: number | null | undefined;
  original_price?: number | null | undefined;
  in_stock?: boolean | null;
  images: string[] | null;
  image_url?: string | null;
  created_at?: string | null;
  slug?: string | null;
  bonus?: number | null;
  short_desc?: string | null;
  description?: string | null;
  composition?: string | null;
  is_popular?: boolean | null;
  is_visible?: boolean | null;
  category_ids: number[];
  subcategory_ids: number[];
  subcategory_names: string[];
  production_time?: number | null;
  order_index?: number | null;
}

export type ProductRow = Database['public']['Tables']['products']['Row'];