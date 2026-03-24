import { YM_DATALAYER_CONTAINER, YM_ID } from './ym';

export function callYm(...args: any[]) {
  if (typeof window === 'undefined') return;
  if (typeof window.ym === 'function') {
    window.ym(...args);
  }
}

export function ensureDataLayer() {
  if (typeof window === 'undefined') return [] as Array<Record<string, any>>;
  window[YM_DATALAYER_CONTAINER as 'dataLayer'] = window[YM_DATALAYER_CONTAINER as 'dataLayer'] || [];
  return window[YM_DATALAYER_CONTAINER as 'dataLayer'] as Array<Record<string, any>>;
}

export function pushDataLayer(payload: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const dl = ensureDataLayer();
  dl.push(payload);
}

export async function getYmClientID(timeoutMs = 10000): Promise<string | null> {
  if (typeof window === 'undefined' || !YM_ID) return null;

  return await new Promise<string | null>((resolve) => {
    const started = Date.now();
    let settled = false;

    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value && value.trim() ? value.trim() : null);
    };

    const attempt = () => {
      if (typeof window.ym === 'function') {
        try {
          window.ym(YM_ID, 'getClientID', (clientId: string) => finish(clientId || null));
          return;
        } catch {
          // continue retry
        }
      }

      if (Date.now() - started >= timeoutMs) {
        finish(null);
        return;
      }

      window.setTimeout(attempt, 350);
    };

    attempt();
  });
}
