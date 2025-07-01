import { prisma } from './prisma';

export async function getFirstPromoBannerUrl(): Promise<string | null> {
  try {
    const firstBanner = await prisma.promo_blocks.findFirst({
      where: { type: 'banner' },
      orderBy: { order_index: 'asc' },
      select: { image_url: true },
    });
    return firstBanner?.image_url || null;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('getFirstPromoBannerUrl error:', err);
    }
    return null;
  }
}
