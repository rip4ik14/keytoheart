// ✅ Путь: utils/useCategories.ts
'use client';

import { useEffect, useState } from 'react';
import { supabasePublic } from '@/lib/supabase/public';

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabasePublic
        .from('categories')
        .select('id, name, slug')
        .order('id', { ascending: true });

      if (data) setCategories(data);
    };

    fetchCategories();
  }, []);

  return categories;
}