// ✅ Путь: components/CSRFToken.tsx
'use client';

import { useEffect, useState } from 'react';

const COOKIE_NAME = 'csrf_token';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.slice(name.length + 1));
    }
  }
  return null;
}

export default function CSRFToken({
  children,
}: {
  children: (token: string) => React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        if (!readCookie(COOKIE_NAME)) {
          const res = await fetch('/api/csrf-token', {
            method: 'GET',
            cache: 'no-store',
            credentials: 'include',
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data?.error || 'Не удалось получить CSRF-токен');
          }
        }

        if (!readCookie(COOKIE_NAME)) {
          throw new Error('CSRF-токен не установлен в cookie');
        }
        setReady(true);
      } catch (e: any) {
        setError(e?.message || 'Ошибка получения CSRF-токена');
      }
    };

    init();
  }, []);

  const token = readCookie(COOKIE_NAME);

  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!ready || !token) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-sm text-gray-500">
        Загрузка...
      </div>
    );
  }

  return <>{children(token)}</>;
}
