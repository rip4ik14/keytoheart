// scripts/exportSlugMap.ts
import { createClient } from '@supabase/supabase-js';

// ⚠️ Укажи сюда свои данные Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportSlugMap() {
  const result: Record<string, string> = {};

  // 🔹 Категории
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('slug, name');

  if (catError) throw new Error('Ошибка получения категорий');

  for (const cat of categories || []) {
    result[cat.slug] = cat.name;
  }

  // 🔹 Подкатегории
  const { data: subcategories, error: subError } = await supabase
    .from('subcategories')
    .select('slug, name');

  if (subError) throw new Error('Ошибка получения подкатегорий');

  for (const sub of subcategories || []) {
    result[sub.slug] = sub.name;
  }

  // 🔹 Вывод
  process.env.NODE_ENV !== "production" && console.log('\nconst RU_TITLES: Record<string, string> = {');
  Object.entries(result).forEach(([slug, name]) => {
    process.env.NODE_ENV !== "production" && console.log(`  '${slug}': '${name}',`);
  });
  process.env.NODE_ENV !== "production" && console.log('};\n');
}

exportSlugMap();
