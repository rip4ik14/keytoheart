import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';

interface OrderResponse {
  success: boolean;
  data: {
    id: string; // Изменяем на string, так как id в базе данных — это UUID
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
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Телефон не указан' }, { status: 400 });
  }

  const phoneRegex = /^\d{10,12}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json({ success: false, error: 'Некорректный формат номера телефона' }, { status: 400 });
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, created_at, total, bonuses_used, payment_method, status')
    .eq('phone', phone)
    .order('created_at', { ascending: false });

  if (error || !orders) {
    return NextResponse.json({ success: false, data: [] }, { status: 200 });
  }

  const orderIds = orders.map((order) => order.id);
  const { data: allItems } = await supabase
    .from('order_items')
    .select('order_id, quantity, price, product_id')
    .in('order_id', orderIds);

  // Фильтруем null значения из product_id и приводим к number[]
  const productIds = [...new Set(allItems?.map((item) => item.product_id).filter((id): id is number => id !== null) || [])];
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
        product_id: item.product_id ?? 0, // Заменяем null на 0, так как product_id в OrderResponse должен быть number
        title: item.product_id !== null ? (productMap.get(item.product_id) || 'Неизвестный товар') : 'Неизвестный товар',
      }));
    return {
      ...order,
      created_at: order.created_at ?? '', // Заменяем null на пустую строку
      total: order.total ?? 0, // Заменяем null на 0
      bonuses_used: order.bonuses_used ?? 0, // Заменяем null на 0
      payment_method: order.payment_method ?? '', // Заменяем null на пустую строку
      status: order.status ?? '', // Заменяем null на пустую строку
      items,
    };
  });

  return NextResponse.json({ success: true, data: ordersWithItems } as OrderResponse, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}