// ✅ Путь: utils/useCategories.ts
'use client';

import { useEffect, useState } from 'react';
export type Category = {
  id: number;
  name: string;
  slug: string;
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (res.ok && json.categories) setCategories(json.categories);
    };

    fetchCategories();
  }, []);

  return categories;
}