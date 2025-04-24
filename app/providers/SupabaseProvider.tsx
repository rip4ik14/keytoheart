"use client";

import { ReactNode } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

interface Props {
  children: ReactNode;
  initialSession: import("@supabase/supabase-js").Session | null;
}

// создаём клиент один раз в браузере
const supabaseClient = createBrowserSupabaseClient();

export default function SupabaseProvider({ children, initialSession }: Props) {
  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}
