'use client';

import React, { useEffect, useState } from 'react';

export default function CSRFToken({
  children,
}: {
  children: (token: string) => React.ReactElement | null;
}) {
  const [token, setToken] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/csrf', { method: 'GET' });
        if (!res.ok) return;

        const data = (await res.json()) as { token?: string };
        if (!cancelled) setToken(data?.token ?? '');
      } catch {
        // молча
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return children(token);
}
