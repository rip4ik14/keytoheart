// ✅ Путь: lib/data/promo.ts
import { prisma } from '@/lib/prisma';

export type PromoBlock = {
  id: number;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  href: string;
  image_url: string;
  type: string;
  order_index: number | null;
};

export async function getPromoBlocks(): Promise<PromoBlock[]> {
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

  return data;
}