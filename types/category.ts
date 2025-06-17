export type Subcategory = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  category_id?: number | null;
  label?: string | null;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  subcategories: Subcategory[];
};
