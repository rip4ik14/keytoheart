// ✅ Путь: components/PromoGridServer.tsx
import PromoGridWrapper from './PromoGridWrapper';
import { getPromoBlocks } from '@/lib/data/promo';

export default async function PromoGridServer() {
  try {
    const data = await getPromoBlocks();

    const banners = (data ?? []).filter((b) => b.type === 'banner');
    const cards = (data ?? []).filter((b) => b.type === 'card');

    // Next.js Image with priority={true} auto-adds <link rel="preload">
    // for the optimized /_next/image URL — no manual preload needed.
    return <PromoGridWrapper banners={banners} cards={cards} />;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('PromoGridServer error:', err);
    }
    return null;
  }
}
