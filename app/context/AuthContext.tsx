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

interface AuthState {
  isAuthenticated: boolean;
  phone: string | null;
  bonus: number | null;
  setAuth: (phone: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function fetchBonuses(phone: string) {
  const res = await fetch(
    `/api/account/bonuses?phone=${encodeURIComponent(phone)}`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    },
  );

  const json = await res.json().catch(() => null);
  if (res.ok && json?.success) return Number(json.data?.bonus_balance ?? 0);
  return null;
}

function isValidRuPhone(p: string | null): p is string {
  return !!p && /^\+7\d{10}$/.test(p);
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    initialIsAuthenticated,
  );
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [bonus, setBonus] = useState<number | null>(initialBonus);

  const pathname = usePathname();
  const syncingRef = useRef(false);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }, []);

  const applyAuth = async (nextPhone: string | null) => {
    if (isValidRuPhone(nextPhone)) {
      setIsAuthenticated(true);
      setPhone(nextPhone);

      try {
        const b = await fetchBonuses(nextPhone);
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

  const refreshAuth = async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      // 1) пробуем Supabase session (если реально используется)
      try {
        const { data } = await supabase.auth.getSession();
        const userPhone = data?.session?.user?.user_metadata?.phone as
          | string
          | undefined;

        if (userPhone) {
          const normalized = normalizePhone(userPhone);
          await applyAuth(isValidRuPhone(normalized) ? normalized : null);
          return;
        }
      } catch {
        // игнорируем
      }

      // 2) пробуем httpOnly cookies через сервер
      const meRes = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const meJson = await meRes.json().catch(() => null);
      const phoneFromServer = normalizePhone(meJson?.phone || '');

      if (meRes.ok && meJson?.isAuthenticated && isValidRuPhone(phoneFromServer)) {
        await applyAuth(phoneFromServer);
        return;
      }

      await applyAuth(null);
    } finally {
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    // стартовый sync
    refreshAuth();

    // Safari/iOS BFCache + возврат на вкладку
    const onPageShow = () => refreshAuth();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshAuth();
    };
    const onFocus = () => refreshAuth();

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    // если Supabase реально используется - слушаем изменения
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshAuth();
    });

    // кастомное событие (на случай твоих текущих вызовов)
    const onAuthChange = () => refreshAuth();
    window.addEventListener('authChange', onAuthChange);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('authChange', onAuthChange);
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // на навигации тоже можно пересинкать (помогает от редких гонок на desktop)
  useEffect(() => {
    refreshAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const setAuth = async (rawPhone: string) => {
    const normalized = normalizePhone(rawPhone);
    await applyAuth(isValidRuPhone(normalized) ? normalized : null);
  };

  const clearAuth = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ок
    }
    await applyAuth(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        phone,
        bonus,
        setAuth,
        clearAuth,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
