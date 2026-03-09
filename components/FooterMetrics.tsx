// ✅ Путь: components/FooterMetrics.tsx
'use client';

import { useEffect } from 'react';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

export default function FooterMetrics() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-site-footer="true"]');
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const node = target?.closest<HTMLElement>('[data-kth-footer-event]');
      if (!node) return;

      const eventName = node.dataset.kthFooterEvent;
      if (!eventName) return;

      const payload: Record<string, string> = {};
      const metricKey = node.dataset.kthFooterMetricKey;
      const metricValue = node.dataset.kthFooterMetricValue;

      if (metricKey && metricValue) {
        payload[metricKey] = metricValue;
      }

      window.gtag?.('event', eventName, {
        event_category: 'footer',
        ...payload,
      });

      if (YM_ID !== undefined) {
        callYm(YM_ID, 'reachGoal', eventName, payload);
      }
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  return null;
}
