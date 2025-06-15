export interface PromoBlock {
  id: number;
  title: string;
  subtitle?: string | null;
  href: string;
  image_url: string;
  type: 'card' | 'banner';
  button_text?: string | null;
  order_index?: number | null;
}
