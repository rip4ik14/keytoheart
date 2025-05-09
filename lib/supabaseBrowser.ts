'use client';

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types_new';

export const supabaseBrowser = createPagesBrowserClient<Database>({
  // Данный код будет работать на клиенте без указания cookies, так как createPagesBrowserClient уже учитывает это автоматически
});
