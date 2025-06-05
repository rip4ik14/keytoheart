import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types_new';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string) {
          cookieStore.delete(name);
        },
      },
    }
  );
}

// Клиент Supabase с сервисным ключом для админ-операций
export const supabaseAdmin = createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    cookies: {
      get() {
        return undefined;
      },
      set() {},
      remove() {},
    },
  }
);

// Функция для инвалидации кэша
export async function invalidate(path: string) {
  try {
    revalidatePath(path);
    process.env.NODE_ENV !== "production" && console.log(`Cache invalidated for path: ${path}`);
  } catch (error) {
    process.env.NODE_ENV !== "production" && console.error(`Error invalidating cache for path ${path}:`, error);
  }
}