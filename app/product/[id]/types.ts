// app/product/[id]/types.ts
export interface Product {
  id: number;
  title: string;
  price: number;
  original_price?: number | null;
  discount_percent: number | null;
  images: string[];
  description: string;
  composition: string;
  production_time: number | null;
  category_ids: number[];
}

export type ComboItem = {
  id: number;
  title: string;
  price: number;
  image: string;
};