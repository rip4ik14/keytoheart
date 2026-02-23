// ✅ Путь: components/PromoGridServer.tsx
import PromoGridWrapper from './PromoGridWrapper';
import type { PromoBlock } from '@/types/promo';
import { getPromoBlocks } from '@/lib/data/promo';

export default async function PromoGridServer() {
  try {
    const data = await getPromoBlocks();

    const banners = (data ?? []).filter((b) => b.type === 'banner') as PromoBlock[];
    const cards = (data ?? []).filter((b) => b.type === 'card') as PromoBlock[];

    return <PromoGridWrapper banners={banners} cards={cards} />;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('PromoGridServer error:', err);
    }
    return null;
  }
}