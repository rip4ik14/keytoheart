interface Window {
    gtag?: (...args: any[]) => void;
    ym?: (id: number, action: string, target: string, params?: Record<string, any>) => void;
  }
  
  declare global {
    interface Window {
      gtag?: (...args: any[]) => void;
      ym?: (id: number, action: string, target: string, params?: Record<string, any>) => void;
    }
  }