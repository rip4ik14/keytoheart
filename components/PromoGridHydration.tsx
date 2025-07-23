'use client';

import dynamic from 'next/dynamic';
import type { PromoBlock } from '@/types/promo';

/* динамически подгружаем тяжёлый Wrapper только на клиенте */
const PromoGridWrapper = dynamic(
  () => import('./PromoGridWrapper'),
  { ssr: false, loading: () => null },
);

export default function PromoGridHydration(props: {
  banners: PromoBlock[];
  cards:   PromoBlock[];
}) {
  return <PromoGridWrapper {...props} />;
}
