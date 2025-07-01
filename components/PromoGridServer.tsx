import PromoGridWrapper from '@components/PromoGridWrapper';
import { prisma } from '@/lib/prisma';
import { PromoBlock } from '@/types/promo';

export default async function PromoGridServer() {
  try {
    // Загружаем из базы как any[]
    const raw: any[] = await prisma.promo_blocks.findMany({
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

    // Приводим явно: отфильтруем мусор и кастуем type
    function toPromoBlock(obj: any): PromoBlock | null {
      if (obj.type !== 'banner' && obj.type !== 'card') return null;
      return {
        id: obj.id,
        title: obj.title,
        subtitle: obj.subtitle,
        button_text: obj.button_text,
        href: obj.href,
        image_url: obj.image_url,
        type: obj.type as 'banner' | 'card',
        order_index: obj.order_index,
      };
    }

    const filtered = raw.map(toPromoBlock).filter(Boolean) as PromoBlock[];
    const banners = filtered.filter((b) => b.type === 'banner');
    const cards = filtered.filter((b) => b.type === 'card');

    return <PromoGridWrapper banners={banners} cards={cards} />;
  } catch (err) {
    process.env.NODE_ENV !== 'production' && console.error('PromoGridServer error:', err);
    return null;
  }
}
