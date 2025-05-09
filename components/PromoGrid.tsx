import { supabaseAdmin } from '@/lib/supabase/server';
import PromoGridWrapper from '@components/PromoGridWrapper';

export const dynamic = 'force-static';
export const revalidate = 300;

export default async function PromoGrid() {
  const { data, error } = await supabaseAdmin
    .from('promo_blocks')
    .select('*')
    .order('order_index');

  if (error || !data) {
    return null;
  }

  const banners = data
    .filter((b) => b.type === 'banner')
    .map((b) => ({
      ...b,
      button_text: b.button_text ?? undefined,
      order_index: b.order_index ?? undefined,
      subtitle: b.subtitle ?? undefined,
      type: b.type as 'banner', // Утверждаем, что type — это 'banner'
    }));

  const cards = data
    .filter((b) => b.type === 'card')
    .map((b) => ({
      ...b,
      button_text: b.button_text ?? undefined,
      order_index: b.order_index ?? undefined,
      subtitle: b.subtitle ?? undefined,
      type: b.type as 'card', // Утверждаем, что type — это 'card'
    }));

  if (!banners.length && !cards.length) return null;

  return <PromoGridWrapper banners={banners} cards={cards} />;
}