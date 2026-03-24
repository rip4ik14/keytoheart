export {};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    ym?: (...args: any[]) => void;
    dataLayer?: Array<Record<string, any>>;
  }
}
