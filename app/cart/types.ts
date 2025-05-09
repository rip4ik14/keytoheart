export interface UpsellItem {
    id: string;
    title: string;
    price: number;
    image_url?: string;
    category: 'postcard' | 'balloon';
  }