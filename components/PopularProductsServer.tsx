import PopularProductsClient from '@components/PopularProductsClient';
import { Product } from '@/types/product';

export default async function PopularProductsServer() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/popular`, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('PopularProductsServer fetch error:', await res.text());
      }
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const products: Product[] = data.map((item: any) => ({
      ...item,
      images: item.images || [],
      category_ids: item.category_ids || [],
    }));
    return <PopularProductsClient products={products} />;
  } catch (err) {
    process.env.NODE_ENV !== 'production' && console.error('PopularProductsServer error:', err);
    return null;
  }
}
