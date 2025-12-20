// ✅ Путь: components/CSRFToken.tsx
'use client';

import { useEffect, useState } from 'react';

export default function CSRFToken({
  children,
}: {
  children: (token: string) => React.ReactNode;
}) {
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/csrf-token', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.csrfToken) {
          throw new Error(data?.error || 'Не удалось получить CSRF-токен');
        }

        setToken(String(data.csrfToken));
      } catch (e: any) {
        setError(e?.message || 'Ошибка получения CSRF-токена');
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-sm text-gray-500">
        Загрузка...
      </div>
    );
  }

  return <>{children(token)}</>;
}
