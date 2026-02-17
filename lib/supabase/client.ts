// ✅ Путь: lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// Публичный клиент для браузера (единый инстанс)
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
 * Совместимость с кодом, где ожидается createClient()
 * Возвращаем тот же инстанс, чтобы не плодить клиентов.
 */
export function createClient() {
  return supabasePublic;
}

export default createClient;
