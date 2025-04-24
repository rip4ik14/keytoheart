// файл: lib/supabase/server.ts

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,       // ваш URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!,      // ключ сервис‑роли
  {
    auth: {
      persistSession: false,     // не пытаться сохранять сессию
      detectSessionInUrl: false, // не парсить сессию из URL
    },
  }
)
