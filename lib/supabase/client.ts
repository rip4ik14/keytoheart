// ✅ Путь: lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// ✅ Публичный Supabase-клиент для браузера (единый инстанс на весь фронт)
export const supabasePublic = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

/**
 * ✅ Совместимость с кодом, где ожидается createClient()
 * Возвращаем тот же инстанс, чтобы не плодить GoTrueClient.
 */
export function createClient() {
  return supabasePublic;
}

export default createClient;
