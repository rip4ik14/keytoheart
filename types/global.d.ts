interface YandexMaps {
  suggest: (
    query: string,
    options: { boundedBy: number[][]; strictBounds: boolean; results: number }
  ) => Promise<{ value: string }[]>;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    ym?: (id: number, action: string, target: string, params?: Record<string, any>) => void;
    ymaps?: YandexMaps;
  }
}

export {};
