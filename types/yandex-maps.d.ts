// types/yandex-maps.d.ts

declare global {
  interface Window {
    ymaps?: YandexMaps;
  }

  interface YandexMaps {
    ready(callback: () => void): void;
    Map: new (
      element: string | HTMLElement,
      options: {
        center: number[];
        zoom: number;
        controls?: string[];
      }
    ) => YandexMap;
    Placemark: new (
      coordinates: number[],
      properties: { balloonContent: string },
      options: { preset: string }
    ) => YandexPlacemark;
    suggest: (
      query: string,
      options: { boundedBy: number[][]; strictBounds: boolean; results: number }
    ) => Promise<{ value: string }[]>;
  }

  interface YandexMap {
    geoObjects: {
      add(placemark: YandexPlacemark): void;
    };
  }

  interface YandexPlacemark {}
}

export {};
