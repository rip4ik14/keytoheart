// components/PromoGridServer.tsx
import PromoBannerServer      from './PromoBannerServer';
import PromoGridHydration     from './PromoGridHydration';   // ⬅️ новый клинт‑гидратор
import type { PromoBlock }    from '@/types/promo';

export const runtime    = 'edge';
export const revalidate = 60;

export default async function PromoGridServer() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/promo`, { next: { revalidate } });
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('PromoGridServer fetch error:', await res.text());
      }
      return null;
    }

    const data: PromoBlock[] = await res.json();
    const banners = (data ?? []).filter((b) => b.type === 'banner');
    const cards   = (data ?? []).filter((b) => b.type === 'card');

    /* SSR отдаём лишь LCP‑баннер — остальное гидрируется на клиенте */
    return (
      <div>
        {banners[0] && <PromoBannerServer banner={banners[0]} />}
        <PromoGridHydration banners={banners} cards={cards} />
      </div>
    );
  } catch (err) {
    process.env.NODE_ENV !== 'production' &&
      console.error('PromoGridServer error:', err);
    return null;
  }
}
