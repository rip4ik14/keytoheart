import { supabasePublic } from '@/lib/supabase/public';
import { Tables } from '@/types';

export async function repeatOrder(
  order: Tables<'orders'> & { order_items: Tables<'order_items'>[] }
) {
  const productIds = order.order_items
    .map((item) => item.product_id)
    .filter((id): id is number => id !== null); // Указываем предикат для фильтрации

  const { data: products } = await supabasePublic
    .from('products')
    .select('id, title, images')
    .in('id', productIds);

  return order.order_items.map((item) => {
    const product = products?.find((p) => p.id === item.product_id);
    return {
      id: item.product_id?.toString() || '',
      title: product?.title || 'Неизвестный товар', // Убираем item.title
      price: item.price || 0,
      quantity: item.quantity || 1,
      imageUrl: product?.images?.[0] || '/no-image.jpg',
    };
  });
}