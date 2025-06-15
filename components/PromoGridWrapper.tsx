'use client';

import dynamic from 'next/dynamic';

const PromoGridClient = dynamic(() => import('./PromoGridClient'), { ssr: false });
import { PromoBlock } from '@/types/promo';

export default function PromoGridWrapper({
  banners,
  cards,
}: {
  banners: PromoBlock[];
  cards: PromoBlock[];
}) {
  if (!banners.length && !cards.length) return null;

  return <PromoGridClient banners={banners} cards={cards} />;
}
