'use client';

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types';

export const supabaseBrowser = createPagesBrowserClient<Database>();
