// ✅ Путь: app/context/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePathname } from 'next/navigation';
import { normalizePhone } from '@/lib/normalizePhone';

type AuthState = {
  isAuthenticated: boolean;
  isReady: boolean; // ✅ важно: UI не должен гадать до проверки
  phone: string | null;
  bonus: number | null;

  setAuth: (phone: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  refreshAuth: (reason?: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchBonuses(phone: string) {
  const res = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(phone)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await safeJson(res);

  if (res.ok && json?.success) {
    const v = Number(json?.data?.bonus_balance ?? 0);
    return Number.isFinite(v) ? v : 0;
  }
  return null;
}

function isValidRuPhone(normalized: string | null) {
  return !!normalized && /^\+7\d{10}$/.test(normalized);
}

export function AuthProvider({
  children,
  initialIsAuthenticated,
  initialPhone,
  initialBonus,
}: {
  children: ReactNode;
  initialIsAuthenticated: boolean;
  initialPhone: string | null;
  initialBonus: number | null;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialIsAuthenticated);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [bonus, setBonus] = useState<number | null>(initialBonus);

  const pathname = usePathname();
  const syncingRef = useRef(false);

  // ✅ защита от гонок: если несколько refreshAuth подряд - учитываем только последний
  const requestIdRef = useRef(0);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }, []);

  const applyAuth = async (normalizedPhone: string | null, opts?: { keepBonus?: boolean }) => {
    if (isValidRuPhone(normalizedPhone)) {
      setIsAuthenticated(true);
      setPhone(normalizedPhone);

      // если бонус уже есть и не нужно перезагружать - не дергаем API
      if (opts?.keepBonus && bonus !== null) return;

      try {
        const b = normalizedPhone ? await fetchBonuses(normalizedPhone) : null;
        setBonus(b ?? 0);
      } catch {
        setBonus(null);
      }
      return;
    }

    setIsAuthenticated(false);
    setPhone(null);
    setBonus(null);
  };

  const refreshAuth = async (_reason?: string) => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const myRequestId = ++requestIdRef.current;

    try {
      // 1) ✅ главный источник истины - серверная сессия (httpOnly cookies)
      // именно она определяет “авторизован ли клиент” в твоей системе
      const resp = await fetch('/api/auth/check-session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const sessionData = await safeJson(resp);

      // если уже был новый запрос - этот результат не применяем
      if (myRequestId !== requestIdRef.current) return;

      if (resp.ok && sessionData?.isAuthenticated && sessionData?.phone) {
        const normalized = normalizePhone(String(sessionData.phone));
        await applyAuth(normalized, { keepBonus: false });
        setIsReady(true);
        return;
      }

      // 2) fallback: Supabase session (если вдруг юзер залогинен через supabase)
      // важно: fallback только если сервер сказал “не авторизован”
      try {
        const { data } = await supabase.auth.getSession();
        const userPhone = data?.session?.user?.user_metadata?.phone as string | undefined;

        if (myRequestId !== requestIdRef.current) return;

        if (userPhone) {
          const normalized = normalizePhone(userPhone);
          await applyAuth(normalized, { keepBonus: false });
          setIsReady(true);
          return;
        }
      } catch {
        // игнор
      }

      // 3) финально: не авторизован
      await applyAuth(null);
      setIsReady(true);
    } catch {
      // при сетевой ошибке: не делаем резкий logout, но отмечаем ready
      // (можно оставить текущее состояние, чтобы не прыгал UI)
      setIsReady(true);
    } finally {
      syncingRef.current = false;
    }
  };

  // ✅ публичные методы для компонентов
  const setAuth = async (rawPhone: string) => {
    const normalized = normalizePhone(rawPhone);
    await applyAuth(normalized, { keepBonus: false });
    setIsReady(true);
    window.dispatchEvent(new Event('authChange'));
  };

  const clearAuth = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ok
    }
    await applyAuth(null);
    setIsReady(true);
    window.dispatchEvent(new Event('authChange'));
  };

  useEffect(() => {
    // стартовый sync
    refreshAuth('mount');

    // BFCache / возврат вкладки / фокус
    const onPageShow = () => refreshAuth('pageshow');
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshAuth('visible');
    };
    const onFocus = () => refreshAuth('focus');

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    // слушаем кастомное событие (logout/login из других мест)
    const onAuthChange = () => refreshAuth('authChange');
    window.addEventListener('authChange', onAuthChange);

    // если Supabase реально используется - тоже синк
    const { data } = supabase.auth.onAuthStateChange(() => {
      refreshAuth('supabase');
    });
    const subscription = data?.subscription;

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('authChange', onAuthChange);
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // при навигации по сайту можно пересинкнуть, но без фанатизма
  useEffect(() => {
    refreshAuth('pathname');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated,
      isReady,
      phone,
      bonus,
      setAuth,
      clearAuth,
      refreshAuth,
    }),
    [isAuthenticated, isReady, phone, bonus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
