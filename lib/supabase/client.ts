// lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

// публичный клиент для браузера
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
