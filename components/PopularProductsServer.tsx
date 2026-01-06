// components/PopularProductsServer.tsx
import PopularProductsClient from '@components/PopularProductsClient';
import { Product } from '@/types/product';

type ProductWithPriority = Product & { priority?: boolean };

const REQUEST_TIMEOUT = 8000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function PopularProductsServer() {
  try {
    // ✅ internal fetch: без baseUrl, без лишнего хопа через nginx
    const res = await fetchWithTimeout(`/api/popular`, {
      // лучше синхронизировать с главной, чтобы не дергать лишний раз
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('PopularProductsServer fetch error:', await res.text());
      }
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    // ⚠️ priority оставляем только если этот блок реально выше фолда и конкурирует за LCP
    const products: ProductWithPriority[] = data.map((item: any, idx: number) => ({
      ...item,
      images: Array.isArray(item.images) ? item.images : [],
      category_ids: Array.isArray(item.category_ids) ? item.category_ids : [],
      priority: idx === 0,
    }));

    return <PopularProductsClient products={products} />;
  } catch (err) {
    process.env.NODE_ENV !== 'production' &&
      console.error('PopularProductsServer error:', err);
    return null;
  }
}
