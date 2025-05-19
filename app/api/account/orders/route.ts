// ✅ Путь: /var/www/keytoheart/app/api/account/orders/route.ts
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
    upsell_details: { title: string; price: number; quantity: number; category: string }[];
  }[];
  error?: string;
}

export async function GET(req: Request) {
  try {
    console.log(`[${new Date().toISOString()}] NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`[${new Date().toISOString()}] NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone) {
      return NextResponse.json({ success: false, error: 'Телефон не указан' }, { status: 400 });
    }

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
      .select('id, created_at, total, bonuses_used, payment_method, status, upsell_details')
      .eq('phone', sanitizedPhone)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения заказов:', error);
      return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      console.log('Заказы не найдены для телефона:', sanitizedPhone);
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const orderIds = orders.map((order) => order.id);
    const { data: allItems, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, quantity, price, product_id')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Ошибка получения элементов заказов:', itemsError);
      return NextResponse.json({ success: false, data: [], error: itemsError.message }, { status: 500 });
    }

    const productIds = Array.from(
      new Set(allItems?.map((item) => item.product_id).filter((id): id is number => id !== null) || [])
    );

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .in('id', productIds);

    if (productsError) {
      console.error('Ошибка получения товаров:', productsError);
      return NextResponse.json({ success: false, data: [], error: productsError.message }, { status: 500 });
    }

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

      const upsellDetails = Array.isArray(order.upsell_details)
        ? order.upsell_details.map((upsell: any) => ({
            title: upsell.title || 'Неизвестный товар',
            price: upsell.price || 0,
            quantity: upsell.quantity || 1,
            category: upsell.category || 'unknown',
          }))
        : [];

      return {
        id: order.id,
        created_at: order.created_at ?? '',
        total: order.total ?? 0,
        bonuses_used: order.bonuses_used ?? 0,
        payment_method: order.payment_method ?? '',
        status: order.status ?? '',
        items,
        upsell_details: upsellDetails,
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