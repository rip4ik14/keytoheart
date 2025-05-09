// ✅ Путь: lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import type { Database } from '@/lib/supabase/types_new';

// Админ-клиент с сервис-ключом (только на сервере!)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Сброс кеша ISR-страниц по тегу
 * Пример: await invalidate('products');
 */
export async function invalidate(tag: string) {
  'use server';
  revalidateTag(tag);
}