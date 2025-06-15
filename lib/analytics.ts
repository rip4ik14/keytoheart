import { callYm } from '../utils/metrics';
import { YM_ID } from '@/utils/ym';

interface EventParams {
  category: string;
  action: string;
  label?: string;
  value?: number;
  type?: string;
}

export function trackEvent({ category, action, label, value, type }: EventParams) {
  if (typeof window !== 'undefined') {
    // Google Analytics (gtag.js)
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value,
      });
    }
    // Яндекс.Метрика
    callYm(YM_ID, 'reachGoal', action, {
      category,
      label,
      value,
      type,
    });
  }
}