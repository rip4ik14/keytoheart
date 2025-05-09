interface EventParams {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

export function trackEvent({ category, action, label, value }: EventParams) {
  // Отправка в Google Analytics (gtag.js)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  // Отправка в Яндекс.Метрику
  if (typeof window !== 'undefined' && window.ym) {
    window.ym(12345678, 'reachGoal', action, {
      category,
      label,
      value,
    });
  }
}