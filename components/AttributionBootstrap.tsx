'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { buildAttributionFromLocation, mergeAttributionClient } from '@/lib/attribution';
import { getYmClientID } from '@/utils/metrics';

export default function AttributionBootstrap() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const base = buildAttributionFromLocation(window.location.href, document.referrer || null);
    mergeAttributionClient(base);

    void getYmClientID().then((clientId) => {
      if (!clientId) return;
      mergeAttributionClient({
        metrika_client_id: clientId,
        last_seen_at: new Date().toISOString(),
      });
    });
  }, [pathname, searchParams?.toString()]);

  return null;
}
