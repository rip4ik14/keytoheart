// ✅ Путь: components/AdvantagesDynamic.tsx
'use client';

import dynamic from 'next/dynamic';

/**
 * Клиентская ленивaя обёртка над настоящим AdvantagesClient.
 * Здесь мы можем использовать `ssr:false`, потому что эта
 * обёртка сама является Client Component-ом.
 */
const AdvantagesClient = dynamic(
  () => import('@components/AdvantagesClient'),
  { ssr: false }
);

export default function AdvantagesDynamic() {
  return <AdvantagesClient />;
}
