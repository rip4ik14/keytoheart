'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// Функция нормализации телефона (взята из CartPage.tsx)
const normalizePhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('7')) return `+${cleanPhone}`;
  if (cleanPhone.length === 10) return `+7${cleanPhone}`;
  if (cleanPhone.length === 11 && cleanPhone.startsWith('8')) return `+7${cleanPhone.slice(1)}`;
  return phone.startsWith('+') ? phone : `+${phone}`;
};

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
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [bonus, setBonus] = useState<number | null>(initialBonus);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Синхронизация сессии с Supabase
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session?.user) {
            const userPhone = session.user.user_metadata?.phone as string | undefined;
            if (userPhone) {
              const normalizedPhone = normalizePhone(userPhone);
              setIsAuthenticated(true);
              setPhone(normalizedPhone);
              try {
                const bonusRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`);
                const bonusJson = await bonusRes.json();
                if (bonusRes.ok && bonusJson.success) {
                  setBonus(bonusJson.data.bonus_balance ?? 0);
                } else {
                  setBonus(null);
                }
              } catch (error) {
                process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки бонусов:', error);
                setBonus(null);
              }
            } else {
              setIsAuthenticated(false);
              setPhone(null);
              setBonus(null);
            }
          } else {
            setIsAuthenticated(false);
            setPhone(null);
            setBonus(null);
          }
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error('Ошибка проверки сессии:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setPhone(null);
          setBonus(null);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session?.user) {
          const userPhone = session.user.user_metadata?.phone as string | undefined;
          if (userPhone) {
            const normalizedPhone = normalizePhone(userPhone);
            setIsAuthenticated(true);
            setPhone(normalizedPhone);
            fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`)
              .then((res) => res.json())
              .then((bonusJson) => {
                if (isMounted && bonusJson.success) {
                  setBonus(bonusJson.data.bonus_balance ?? 0);
                } else if (isMounted) {
                  setBonus(null);
                }
              })
              .catch(() => {
                if (isMounted) setBonus(null);
              });
          } else {
            setIsAuthenticated(false);
            setPhone(null);
            setBonus(null);
          }
        } else {
          setIsAuthenticated(false);
          setPhone(null);
          setBonus(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const setAuth = async (phone: string) => {
    const normalizedPhone = normalizePhone(phone);
    setIsAuthenticated(true);
    setPhone(normalizedPhone);
    try {
      const bonusRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`);
      const bonusJson = await bonusRes.json();
      if (bonusRes.ok && bonusJson.success) {
        setBonus(bonusJson.data.bonus_balance ?? 0);
      } else {
        setBonus(null);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки бонусов:', error);
      setBonus(null);
    }
  };

  const clearAuth = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setPhone(null);
      setBonus(null);
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка при выходе:', error);
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