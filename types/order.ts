export type OrderItem = {
  product_id: number;
  quantity: number;
  price: number;
  title: string;
  cover_url: string | null;
};

export type UpsellDetail = {
  title: string;
  price: number;
  quantity: number;
  category: string;
};

export type Order = {
  id: string;
  created_at: string;
  total: number;
  bonuses_used: number;
  payment_method: string;
  status: string;
  recipient: string;
  items: OrderItem[];
  upsell_details: UpsellDetail[];
};
