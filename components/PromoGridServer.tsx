// ✅ Путь: components/PromoGridServer.tsx
import PromoGridWrapper from './PromoGridWrapper';
import { PromoBlock } from '@/types/promo';

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

export default async function PromoGridServer() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetchWithTimeout(`${baseUrl}/api/promo`, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
      cache: 'force-cache',
    });

    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('PromoGridServer fetch error:', await res.text());
      }
      return null;
    }

    const data: PromoBlock[] = await res.json();

    const banners = (data ?? []).filter((b) => b.type === 'banner');
    const cards = (data ?? []).filter((b) => b.type === 'card');

    return <PromoGridWrapper banners={banners} cards={cards} />;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('PromoGridServer error:', err);
    }
    return null;
  }
}