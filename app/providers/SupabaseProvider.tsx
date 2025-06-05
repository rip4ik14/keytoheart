'use client';

import { useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

interface SupabaseProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

export default function SupabaseProvider({ children, initialUser }: SupabaseProviderProps) {
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    const client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
    setSupabase(client);

    // Если пользователь аутентифицирован, проверяем сессию
    if (initialUser) {
      // Примечание: User не содержит access_token и refresh_token.
      // Сессия должна быть уже установлена в браузере через cookies.
      client.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          process.env.NODE_ENV !== "production" && console.log(`[${new Date().toISOString()}] No active session for user:`, initialUser.id);
        }
      });
    }
  }, [initialUser]);

  if (!supabase) return null; // Избегаем рендеринга до инициализации клиента

  return <>{children}</>;
}