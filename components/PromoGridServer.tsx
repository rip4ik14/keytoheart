// components/PromoGridServer.tsx
import PromoGridWrapper from './PromoGridWrapper';
import { PromoBlock } from '@/types/promo';

export default async function PromoGridServer() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/promo`, { next: { revalidate: 60 } });
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
    process.env.NODE_ENV !== 'production' && console.error('PromoGridServer error:', err);
    return null;
  }
}
