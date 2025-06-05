import { supabaseAdmin } from '@/lib/supabase/server';
import PromoGridWrapper from '@components/PromoGridWrapper';
import type { Database } from '@/lib/supabase/types_new'; // Импортируем типы Supabase
import type { PostgrestError } from '@supabase/supabase-js';

export const dynamic = 'force-static';
export const revalidate = 300;

// Тип для данных из promo_blocks (используем типы из types_new.ts)
type PromoBlock = Database['public']['Tables']['promo_blocks']['Row'];

// Функция для выполнения запроса с таймаутом
async function fetchPromoBlocksWithTimeout(timeoutMs: number) {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request to Supabase timed out')), timeoutMs)
  );

  const supabasePromise = supabaseAdmin
    .from('promo_blocks')
    .select('*')
    .order('order_index');

  // Ожидаем только после .select().order(), т.е. добавляем .then(res => res) чтобы получить Promise<{data, error}>
  const supabaseDataPromise = supabasePromise.then((res) => res);

  // Гонка между таймаутом и промисом запроса
  return Promise.race([supabaseDataPromise, timeout]);
}

export default async function PromoGrid() {
  let data: PromoBlock[] | null = null;
  let error: PostgrestError | null = null;

  try {
    // Выполняем запрос к Supabase с таймаутом
    const result = await fetchPromoBlocksWithTimeout(2000) as { data: PromoBlock[] | null; error: PostgrestError | null };
    data = result.data;
    error = result.error;
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Error fetching promo blocks:', err.message);
    error = err;
  }

  if (error || !data) {
    process.env.NODE_ENV !== "production" && console.error('PromoGrid failed to load data:', error?.message || 'No data');
    return null;
  }

  const banners = data
    .filter((b) => b.type === 'banner')
    .map((b) => ({
      ...b,
      button_text: b.button_text ?? undefined,
      order_index: b.order_index ?? undefined,
      subtitle: b.subtitle ?? undefined,
      type: b.type as 'banner',
    }));

  const cards = data
    .filter((b) => b.type === 'card')
    .map((b) => ({
      ...b,
      button_text: b.button_text ?? undefined,
      order_index: b.order_index ?? undefined,
      subtitle: b.subtitle ?? undefined,
      type: b.type as 'card',
    }));

  if (!banners.length && !cards.length) return null;

  return <PromoGridWrapper banners={banners} cards={cards} />;
}
