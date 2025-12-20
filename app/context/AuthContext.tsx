// ✅ Путь: app/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { normalizePhone } from '@/lib/normalizePhone';

interface AuthState {
  isAuthenticated: boolean;
  phone: string | null;
  bonus: number | null;
  setAuth: (phone: string) => Promise<void>;
  clearAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

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
  const [phone, setPhone] = useState<string | null>(initialPhone ? normalizePhone(initialPhone) : null);
  const [bonus, setBonus] = useState<number | null>(initialBonus);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadBonus = async (normalizedPhone: string) => {
    try {
      const bonusRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const bonusJson = await bonusRes.json();

      if (bonusRes.ok && bonusJson?.success) {
        setBonus(bonusJson?.data?.bonus_balance ?? 0);
      } else {
        setBonus(null);
      }
    } catch (error) {
      process.env.NODE_ENV !== 'production' && console.error('Ошибка загрузки бонусов:', error);
      setBonus(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        const userPhone = (session?.user?.user_metadata?.phone as string | undefined) || null;

        if (!userPhone) {
          setIsAuthenticated(false);
          setPhone(null);
          setBonus(null);
          return;
        }

        const normalized = normalizePhone(userPhone);

        if (!/^\+7\d{10}$/.test(normalized)) {
          setIsAuthenticated(false);
          setPhone(null);
          setBonus(null);
          return;
        }

        setIsAuthenticated(true);
        setPhone(normalized);
        await loadBonus(normalized);
      } catch (error) {
        process.env.NODE_ENV !== 'production' && console.error('Ошибка проверки сессии:', error);
        if (!isMounted) return;
        setIsAuthenticated(false);
        setPhone(null);
        setBonus(null);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const userPhone = (session?.user?.user_metadata?.phone as string | undefined) || null;

      if (!userPhone) {
        setIsAuthenticated(false);
        setPhone(null);
        setBonus(null);
        return;
      }

      const normalized = normalizePhone(userPhone);

      if (!/^\+7\d{10}$/.test(normalized)) {
        setIsAuthenticated(false);
        setPhone(null);
        setBonus(null);
        return;
      }

      setIsAuthenticated(true);
      setPhone(normalized);
      await loadBonus(normalized);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAuth = async (rawPhone: string) => {
    const normalized = normalizePhone(rawPhone);

    if (!/^\+7\d{10}$/.test(normalized)) {
      setIsAuthenticated(false);
      setPhone(null);
      setBonus(null);
      return;
    }

    setIsAuthenticated(true);
    setPhone(normalized);
    await loadBonus(normalized);
  };

  const clearAuth = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      process.env.NODE_ENV !== 'production' && console.error('Ошибка при выходе:', error);
    } finally {
      setIsAuthenticated(false);
      setPhone(null);
      setBonus(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, phone, bonus, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
