// ✅ Путь: components/CSRFToken.tsx
'use client';

import { useEffect, useState } from 'react';

export default function CSRFToken({ children }: { children: (token: string) => JSX.Element }) {
  const [token, setToken] = useState('');

  useEffect(() => {
    // Получаем CSRF-токен с сервера
    const fetchToken = async () => {
      try {
        const res = await fetch('/api/csrf-token', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.csrfToken) {
          setToken(data.csrfToken);
        } else {
          console.error('Failed to fetch CSRF token');
        }
      } catch (err) {
        console.error('Error fetching CSRF token:', err);
      }
    };

    fetchToken();
  }, []);

  if (!token) {
    return null; // Ждём, пока токен загрузится
  }

  return children(token);
}