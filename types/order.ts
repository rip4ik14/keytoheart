export type OrderItem = {
  products: { title: string; cover_url: string | null };
  quantity: number;
  price: number;
  product_id: number;
};

export type UpsellDetail = {
  title: string;
  price: number;
  quantity: number;
  category: string;
};

export type Order = {
  id: number;
  created_at: string;
  total: number;
  bonuses_used: number;
  payment_method: 'cash' | 'card';
  status: string;
  items: OrderItem[];
  upsell_details: UpsellDetail[];
};
