import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import sanitizeHtml from 'sanitize-html';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Получаем сумму всех заказов
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total')
      .eq('phone', sanitizedPhone)
      .in('status', ['completed', 'delivered', 'paid']); // Расширяем список статусов

    if (ordersError) {
      console.error(`[${new Date().toISOString()}] Error fetching orders:`, ordersError);
      return NextResponse.json(
        { success: false, error: 'Ошибка получения заказов: ' + ordersError.message },
        { status: 500 }
      );
    }

    console.log(`[${new Date().toISOString()}] Orders fetched for phone ${sanitizedPhone}:`, orders);

    let totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Если заказы не найдены, пробуем взять total_spent из bonuses
    if (totalSpent === 0) {
      const { data: bonusData, error: bonusError } = await supabase
        .from('bonuses')
        .select('total_spent')
        .eq('phone', sanitizedPhone)
        .single();

      if (bonusError) {
        console.error(`[${new Date().toISOString()}] Error fetching total_spent from bonuses:`, bonusError);
      } else {
        totalSpent = bonusData?.total_spent || 0;
        console.log(`[${new Date().toISOString()}] Fallback total_spent from bonuses for phone ${sanitizedPhone}: ${totalSpent}`);
      }
    }

    console.log(`[${new Date().toISOString()}] Total spent for phone ${sanitizedPhone}: ${totalSpent}`);

    // Определяем уровень
    let level: string;
    if (totalSpent >= 50000) level = 'premium';
    else if (totalSpent >= 30000) level = 'platinum';
    else if (totalSpent >= 20000) level = 'gold';
    else if (totalSpent >= 10000) level = 'silver';
    else level = 'bronze';

    // Обновляем уровень в таблице bonuses
    const { error: updateError } = await supabase
      .from('bonuses')
      .update({ level, updated_at: new Date().toISOString() })
      .eq('phone', sanitizedPhone);

    if (updateError) {
      console.error(`[${new Date().toISOString()}] Error updating loyalty level:`, updateError);
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления уровня: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log(`[${new Date().toISOString()}] Updated loyalty level to ${level} for phone ${sanitizedPhone}`);

    return NextResponse.json({ success: true, level });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in update-loyalty:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}