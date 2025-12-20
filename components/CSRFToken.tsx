'use client';

import { useEffect, useState } from 'react';

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function CSRFToken({
  children,
}: {
  children: (token: string) => React.ReactNode;
}) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      // 1) если cookie уже есть - берём сразу её (это то, что проверяет сервер)
      const fromCookie = getCookie('csrf_token');
      if (fromCookie) {
        setToken(fromCookie);
        return;
      }

      // 2) если cookie нет - создаём её через /api/csrf (ниже дам файл)
      await fetch('/api/csrf', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });

      // 3) читаем cookie ещё раз
      const after = getCookie('csrf_token');
      setToken(after || '');
    };

    init();
  }, []);

  if (!token) return null;

  return <>{children(token)}</>;
}
