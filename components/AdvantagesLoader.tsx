// components/AdvantagesLoader.tsx
'use client';

import dynamic from 'next/dynamic';

const AdvantagesClient = dynamic(
  () => import('@components/AdvantagesClient'),
  { ssr: false, loading: () => null }
);

export default function AdvantagesLoader() {
  return <AdvantagesClient />;
}
