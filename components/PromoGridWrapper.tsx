'use client';

import dynamic from 'next/dynamic';

const PromoGridClient = dynamic(() => import('./PromoGridClient'), { ssr: false });

interface Block {
  id: number;
  title: string;
  subtitle?: string;
  href: string;
  image_url: string;
  type: 'card' | 'banner';
  button_text?: string;
}

export default function PromoGridWrapper({
  banners,
  cards,
}: {
  banners: Block[];
  cards: Block[];
}) {
  if (!banners.length && !cards.length) return null;

  return <PromoGridClient banners={banners} cards={cards} />;
}
