import PopularProductsClient from '@components/PopularProductsClient';
import { Product } from '@/types/product';

type ProductWithPriority = Product & { priority?: boolean };

const REQUEST_TIMEOUT = 8000;

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export default async function PopularProductsServer() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    /* —----- получаем данные —----- */
    const res = await fetchWithTimeout(`${baseUrl}/api/popular`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('PopularProductsServer fetch error:', await res.text());
      }
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    /* —----- помечаем LCP-изображения (только первый товар) —----- */
    const products: ProductWithPriority[] = data.map((item: any, idx: number) => ({
      ...item,
      images: item.images || [],
      category_ids: item.category_ids || [],
      priority: idx === 0,        // <-- единственный «high» / eager
    }));

    return <PopularProductsClient products={products} />;
  } catch (err) {
    process.env.NODE_ENV !== 'production' &&
      console.error('PopularProductsServer error:', err);
    return null;
  }
}
