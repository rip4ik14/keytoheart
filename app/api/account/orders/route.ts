import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import sanitizeHtml from 'sanitize-html';

interface OrderResponse {
  success: boolean;
  data: {
    id: string;
    created_at: string;
    total: number;
    bonuses_used: number;
    payment_method: string;
    status: string;
    items: { quantity: number; price: number; product_id: number; title: string }[];
  }[];
  error?: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    // Санитизация номера телефона
    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone) {
      return NextResponse.json({ success: false, error: 'Телефон не указан' }, { status: 400 });
    }

    // Валидация формата телефона
    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    console.log('Получение заказов для телефона:', sanitizedPhone);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, created_at, total, bonuses_used, payment_method, status')
      .eq('phone', sanitizedPhone)
      .order('created_at', { ascending: false });

    if (error || !orders) {
      console.error('Ошибка получения заказов:', error);
      return NextResponse.json({ success: false, data: [] }, { status: 200 });
    }

    const orderIds = orders.map((order) => order.id);
    const { data: allItems } = await supabase
      .from('order_items')
      .select('order_id, quantity, price, product_id')
      .in('order_id', orderIds);

    // Фильтруем null значения из product_id и приводим к number[]
    const productIds = [
      ...new Set(allItems?.map((item) => item.product_id).filter((id): id is number => id !== null) || []),
    ];
    const { data: products } = await supabase
      .from('products')
      .select('id, title')
      .in('id', productIds);

    const productMap = new Map(products?.map((p) => [p.id, p.title]) || []);

    const ordersWithItems = orders.map((order) => {
      const items = (allItems || [])
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          quantity: item.quantity,
          price: item.price,
          product_id: item.product_id ?? 0,
          title: item.product_id !== null ? productMap.get(item.product_id) || 'Неизвестный товар' : 'Неизвестный товар',
        }));
      return {
        ...order,
        created_at: order.created_at ?? '',
        total: order.total ?? 0,
        bonuses_used: order.bonuses_used ?? 0,
        payment_method: order.payment_method ?? '',
        status: order.status ?? '',
        items,
      };
    });

    console.log('Возвращаемые заказы:', ordersWithItems);

    return NextResponse.json(
      { success: true, data: ordersWithItems } as OrderResponse,
      {
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch (error: any) {
    console.error('Ошибка обработки запроса заказов:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}