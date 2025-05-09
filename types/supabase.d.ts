// ✅ Путь: types/supabase.d.ts
import { User } from '@supabase/supabase-js';

// Расширяем тип User из @supabase/supabase-js, добавляя user_metadata
declare module '@supabase/supabase-js' {
  interface User {
    user_metadata?: {
      phone?: string;
      [key: string]: any;
    };
  }
}