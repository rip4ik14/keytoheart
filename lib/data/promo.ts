import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { PromoBlock } from '@/types/promo';

const getPromoBlocksCached = unstable_cache(
  async (): Promise<PromoBlock[]> => {
    const data = await prisma.promo_blocks.findMany({
      orderBy: { order_index: 'asc' },
      select: {
        id: true,
        title: true,
        subtitle: true,
        button_text: true,
        href: true,
        image_url: true,
        type: true,
        order_index: true,
      },
    });

    return data as PromoBlock[];
  },
  ['promo-blocks'],
  { revalidate: 60, tags: ['promo-blocks'] },
);

export async function getPromoBlocks(): Promise<PromoBlock[]> {
  return getPromoBlocksCached();
}
