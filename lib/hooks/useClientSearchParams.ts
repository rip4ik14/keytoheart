'use client';

import { useMemo, useSyncExternalStore } from 'react';

declare global {
  interface Window {
    __kthSearchParamsPatched?: boolean;
  }
}

function ensureHistoryPatched() {
  if (typeof window === 'undefined' || window.__kthSearchParamsPatched) return;

  const wrap = (method: 'pushState' | 'replaceState') => {
    const original = window.history[method];
    window.history[method] = function (...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args as any);
      window.dispatchEvent(new Event('kth:searchchange'));
      return result;
    } as History[typeof method];
  };

  wrap('pushState');
  wrap('replaceState');
  window.__kthSearchParamsPatched = true;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  ensureHistoryPatched();

  const handler = () => onStoreChange();
  window.addEventListener('popstate', handler);
  window.addEventListener('kth:searchchange', handler as EventListener);

  return () => {
    window.removeEventListener('popstate', handler);
    window.removeEventListener('kth:searchchange', handler as EventListener);
  };
}

function getSnapshot() {
  if (typeof window === 'undefined') return '';
  return window.location.search || '';
}

function getServerSnapshot() {
  return '';
}

export default function useClientSearchParams() {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => new URLSearchParams(search), [search]);
}
