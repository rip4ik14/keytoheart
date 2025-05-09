// ✅ Путь: lib/supabase/public.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export const supabasePublic = createClient<Database>(
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