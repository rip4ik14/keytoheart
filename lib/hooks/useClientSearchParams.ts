'use client';

import { useEffect, useMemo, useState } from 'react';

type HistoryMethod = 'pushState' | 'replaceState';

function readSearch(): string {
  if (typeof window === 'undefined') return '';
  return window.location.search || '';
}

export function useClientSearchParams() {
  const [search, setSearch] = useState<string>(() => readSearch());

  useEffect(() => {
    const notify = () => setSearch(readSearch());

    const restoreFns: Array<() => void> = [];

    const patchHistory = (method: HistoryMethod) => {
      const original = window.history[method];

      const patched = function (
        this: History,
        ...args: Parameters<History['pushState']>
      ) {
        const result = original.apply(
          window.history,
          args as [data: unknown, unused: string, url?: string | URL | null]
        );
        window.dispatchEvent(new Event('kth:searchchange'));
        return result;
      } as History[typeof method];

      window.history[method] = patched;

      restoreFns.push(() => {
        window.history[method] = original;
      });
    };

    patchHistory('pushState');
    patchHistory('replaceState');

    window.addEventListener('popstate', notify);
    window.addEventListener('kth:searchchange', notify);

    notify();

    return () => {
      window.removeEventListener('popstate', notify);
      window.removeEventListener('kth:searchchange', notify);
      restoreFns.forEach((restore) => restore());
    };
  }, []);

  return useMemo(() => new URLSearchParams(search), [search]);
}

export default useClientSearchParams;
