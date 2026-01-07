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

async function ensureCsrfToken(): Promise<string> {
  const existing = readCookie(COOKIE_NAME);
  if (existing) {
    return existing;
  }

  const res = await fetch('/api/csrf-token', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.token) {
    throw new Error(data?.error || 'Не удалось получить CSRF-токен');
  }

  return String(data.token);
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await ensureCsrfToken();
  const headers = new Headers(init.headers);
  headers.set('x-csrf-token', token);

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}
