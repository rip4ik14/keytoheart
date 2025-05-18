// lib/supabase/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types_new';

const supabaseAdmin = createClient<
  Database,
  'public',
  Database['public']
>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      // на сервере не храним сессии
      persistSession: false,
      detectSessionInUrl: false,
    }
  }
)

export default supabaseAdmin
