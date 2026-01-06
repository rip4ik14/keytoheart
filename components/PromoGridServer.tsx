// ✅ Путь: components/PromoGridServer.tsx
import PromoBannerServer from './PromoBannerServer';
import PromoGridWrapper from './PromoGridWrapper';
import { PromoBlock } from '@/types/promo';
import { headers } from 'next/headers';

const REQUEST_TIMEOUT = 8000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function getBaseUrl() {
  const h = await headers();

  // На self-hosted чаще всего прилетает host и x-forwarded-proto
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('x-forwarded-host') ?? h.get('host');

  if (host) return `${proto}://${host}`;

  // fallback (на всякий случай)
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://keytoheart.ru';
}

export default async function PromoGridServer() {
  try {
    const baseUrl = await getBaseUrl();

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

    // SSR - только первый баннер (для LCP)
    return (
      <div>
        {banners[0] && <PromoBannerServer banner={banners[0]} />}
        <PromoGridWrapper banners={banners} cards={cards} />
      </div>
    );
  } catch (err) {
    process.env.NODE_ENV !== 'production' &&
      console.error('PromoGridServer error:', err);
    return null;
  }
}
