'use client';

import { useState, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Session } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

interface SupabaseProviderProps {
  children: ReactNode;
  initialSession: Session | null;
}

export default function SupabaseProvider({ children, initialSession }: SupabaseProviderProps) {
  const [supabase] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  );

  // Устанавливаем начальную сессию, если она передана
  if (initialSession) {
    supabase.auth.setSession(initialSession);
  }

  return <>{children}</>;
}