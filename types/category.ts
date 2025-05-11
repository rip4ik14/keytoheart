export type Category = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  subcategories: {
    id: number;
    name: string;
    slug: string;
    is_visible: boolean;
  }[];
};