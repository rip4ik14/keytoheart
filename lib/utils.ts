export interface ProductData {
  title: string;
  price: number;
}

export function validateProduct(data: ProductData): string | null {
  if (!data.title || data.title.length < 3) {
    return 'Название должно быть не короче 3 символов';
  }
  if (!data.price || data.price <= 0) {
    return 'Цена должна быть больше 0';
  }
  return null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/g, '-')
    .replace(/(^-|-$)/g, '');
}