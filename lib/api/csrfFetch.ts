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

  return fetchCsrfToken();
}

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf-token', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Не удалось получить CSRF-токен');
  }

  const refreshed = readCookie(COOKIE_NAME);
  if (!refreshed) {
    throw new Error('CSRF-токен не установлен в cookie');
  }

  return refreshed;
}

async function isCsrfErrorResponse(res: Response): Promise<boolean> {
  if (res.status !== 403) {
    return false;
  }

  const clone = res.clone();
  try {
    const data = await clone.json();
    const errorText =
      typeof data === 'string' ? data : typeof data?.error === 'string' ? data.error : '';
    return (
      errorText.includes('Invalid CSRF token') || errorText.includes('CSRF token missing')
    );
  } catch {
    try {
      const text = await clone.text();
      return (
        text.includes('Invalid CSRF token') || text.includes('CSRF token missing')
      );
    } catch {
      return false;
    }
  }
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await ensureCsrfToken();
  const headers = new Headers(init.headers);
  headers.set('x-csrf-token', token);

  const initialResponse = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!(await isCsrfErrorResponse(initialResponse))) {
    return initialResponse;
  }

  const refreshedToken = await fetchCsrfToken();
  const retryHeaders = new Headers(init.headers);
  retryHeaders.set('x-csrf-token', refreshedToken);

  return fetch(input, {
    ...init,
    headers: retryHeaders,
    credentials: 'include',
  });
}
