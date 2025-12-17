// components/PromoGridServer.tsx
import PromoBannerServer from './PromoBannerServer';
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
      next: { revalidate: 60 },
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

    // SSR — только первый баннер!
    return (
      <div>
        {banners[0] && <PromoBannerServer banner={banners[0]} />}
        <PromoGridWrapper banners={banners} cards={cards} />
      </div>
    );
  } catch (err) {
    process.env.NODE_ENV !== 'production' && console.error('PromoGridServer error:', err);
    return null;
  }
}
