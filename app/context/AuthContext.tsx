'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
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
  const res = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(phone)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (res.ok && json?.success) return Number(json.data?.bonus_balance ?? 0);
  return null;
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
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [bonus, setBonus] = useState<number | null>(initialBonus);

  const pathname = usePathname();
  const syncingRef = useRef(false);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const applyAuth = async (normalizedPhone: string | null) => {
    if (normalizedPhone && /^\+7\d{10}$/.test(normalizedPhone)) {
      setIsAuthenticated(true);
      setPhone(normalizedPhone);

      try {
        const b = await fetchBonuses(normalizedPhone);
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
      // 1) пробуем Supabase session (если она реально используется)
      try {
        const { data } = await supabase.auth.getSession();
        const userPhone = data?.session?.user?.user_metadata?.phone as string | undefined;
        if (userPhone) {
          const normalized = normalizePhone(userPhone);
          await applyAuth(normalized);
          return;
        }
      } catch {
        // игнорируем, потому что у тебя авторизация может жить не только в Supabase
      }

      // 2) пробуем cookie user_phone через сервер (httpOnly)
      const meRes = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const meJson = await meRes.json().catch(() => null);
      const phoneFromCookie = normalizePhone(meJson?.phone || '');

      if (meRes.ok && meJson?.isAuthenticated && /^\+7\d{10}$/.test(phoneFromCookie)) {
        await applyAuth(phoneFromCookie);
        return;
      }

      await applyAuth(null);
    } finally {
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    // 1) обычный стартовый sync
    refreshAuth();

    // 2) Safari iOS: возврат из bfcache
    const onPageShow = (e: PageTransitionEvent) => {
      if ((e as any).persisted) {
        refreshAuth();
      } else {
        refreshAuth();
      }
    };

    // 3) вернулся на вкладку
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshAuth();
    };

    // 4) вернул фокус
    const onFocus = () => refreshAuth();

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    // 5) если Supabase реально используется, слушаем его изменения
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshAuth();
    });

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6) при переходах по сайту тоже пересинк (в Next App Router это нормально)
  useEffect(() => {
    refreshAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const setAuth = async (rawPhone: string) => {
    const normalized = normalizePhone(rawPhone);
    await applyAuth(normalized);
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
