import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function POST(req: Request) {
  const {
    phone,
    name,
    recipient,
    address,
    deliveryMethod,
    date,
    time,
    payment,
    items: cart,
    total,
    bonuses_used = 0,
    bonus = 0,
    promo_id,
    promo_discount = 0,
    delivery_instructions,
    postcard_text,
    anonymous,
    whatsapp,
  } = await req.json();

  if (!phone || !name || !total || !cart) {
    console.error('Missing required fields:', { phone, name, total, cart });
    return NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 });
  }

  // Разделяем основные товары и upsell-дополнения
  const regularItems = cart.filter((item: any) => !item.isUpsell);
  const upsellItems = cart.filter((item: any) => item.isUpsell);

  // Логируем содержимое корзины для отладки
  console.log('Cart items:', cart);
  console.log('Regular items:', regularItems);
  console.log('Upsell items:', upsellItems);

  // Проверяем, что все product_id для основных товаров существуют в таблице products
  const productIds = regularItems
    .map((item: any) => parseInt(item.id, 10))
    .filter((id: number) => !isNaN(id));

  if (productIds.length !== regularItems.length) {
    console.error('Invalid product IDs (not numbers):', regularItems);
    return NextResponse.json(
      { error: 'Некоторые ID товаров некорректны (не числа)' },
      { status: 400 }
    );
  }

  if (productIds.length > 0) {
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id')
      .in('id', productIds);

    if (productsError) {
      console.error('Error checking products:', productsError);
      return NextResponse.json({ error: 'Ошибка проверки товаров' }, { status: 500 });
    }

    console.log('Product IDs to check:', productIds);
    console.log('Existing products:', products);

    const existingProductIds = new Set(products.map((p: any) => p.id));
    const invalidItems = regularItems.filter((item: any) => !existingProductIds.has(parseInt(item.id, 10)));
    if (invalidItems.length > 0) {
      console.error('Invalid product IDs:', invalidItems);
      return NextResponse.json(
        { error: `Товары с ID ${invalidItems.map((i: any) => i.id).join(', ')} не найдены` },
        { status: 400 }
      );
    }
  }

  // Сохраняем заказ
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert([
      {
        phone,
        contact_name: name,
        recipient,
        address,
        delivery_method: deliveryMethod,
        delivery_date: date,
        delivery_time: time,
        payment_method: payment,
        total,
        bonuses_used,
        bonus,
        promo_id,
        promo_discount,
        status: 'Ожидает подтверждения',
        created_at: new Date().toISOString(),
        delivery_instructions,
        postcard_text,
      },
    ])
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    console.error('Error saving order:', orderError);
    return NextResponse.json({ error: 'Ошибка сохранения заказа' }, { status: 500 });
  }

  // Сохраняем основные товары в order_items
  const orderItems = regularItems.map((item: any) => ({
    order_id: order.id,
    product_id: parseInt(item.id, 10),
    quantity: item.quantity,
    price: item.price,
  }));

  if (orderItems.length > 0) {
    const { error: itemError } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemError) {
      console.error('Error saving order items:', itemError);
      return NextResponse.json({ error: 'Ошибка сохранения товаров' }, { status: 500 });
    }
  }

  // Сохраняем upsell-дополнения
  const upsellDetails = upsellItems.map((item: any) => ({
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    category: item.category, // postcard или balloon
  }));

  const { error: updateOrderError } = await supabaseAdmin
    .from('orders')
    .update({ upsell_details: upsellDetails })
    .eq('id', order.id);

  if (updateOrderError) {
    console.error('Error saving upsell details:', updateOrderError);
    return NextResponse.json({ error: 'Ошибка сохранения дополнений' }, { status: 500 });
  }

  const baseUrl = new URL(req.url).origin;

  // Обработка списания бонусов
  if (bonuses_used > 0) {
    const res = await fetch(`${baseUrl}/api/redeem-bonus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: phone, amount: bonuses_used, order_id: order.id }),
    });
    if (!res.ok) {
      console.error('Ошибка списания бонусов:', await res.text());
    }
  }

  // Начисление бонусов
  const resBonus = await fetch(`${baseUrl}/api/order-bonus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: phone, order_total: total, order_id: order.id }),
  });
  if (!resBonus.ok) {
    console.error('Ошибка начисления бонусов:', await resBonus.text());
  }

  // Обновление промокода
  if (promo_id) {
    // Сначала получаем текущее значение used_count
    const { data: promoData, error: promoFetchError } = await supabaseAdmin
      .from('promo_codes')
      .select('used_count')
      .eq('id', promo_id)
      .single();

    if (promoFetchError || !promoData) {
      console.error('Ошибка получения промокода:', promoFetchError?.message);
    } else {
      const newUsedCount = (promoData.used_count || 0) + 1;
      const { error: promoUpdateError } = await supabaseAdmin
        .from('promo_codes')
        .update({ used_count: newUsedCount })
        .eq('id', promo_id);
      if (promoUpdateError) {
        console.error('Ошибка обновления промокода:', promoUpdateError.message);
      }
    }
  }

  // Формируем сообщение для Telegram
  const itemsList = regularItems.length
    ? regularItems.map((i: any) => `• ${i.title} ×${i.quantity} — ${i.price * i.quantity}₽`).join('\n')
    : 'Нет основных товаров';
  const upsellList = upsellItems.length
    ? upsellItems.map((i: any) => `• ${i.title} (${i.category}) ×${i.quantity} — ${i.price}₽`).join('\n')
    : 'Нет дополнений';
  const deliveryMethodText = deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка';
  const promoText = promo_id
    ? `<b>Промокод:</b> Применён (скидка: ${promo_discount}₽)`
    : `<b>Промокод:</b> Не применён`;
  const anonymousText = anonymous ? 'Да' : 'Нет';
  const whatsappText = whatsapp ? 'Да' : 'Нет';
  const postcardTextMessage = postcard_text ? postcard_text : 'Не указан';
  const message = `<b>🆕 Новый заказ #${order.order_number}</b>
<b>Имя:</b> ${name}
<b>Телефон:</b> ${phone}
<b>Сумма:</b> ${total} ₽
<b>Бонусы списано:</b> ${bonuses_used}
<b>Бонусы начислено:</b> ${bonus}
<b>Дата/Время:</b> ${date} ${time}
<b>Способ доставки:</b> ${deliveryMethodText}
<b>Адрес:</b> ${address || 'Не указан (самовывоз)'}
<b>Получатель:</b> ${recipient}
<b>Оплата:</b> ${payment === 'cash' ? 'Наличные' : 'Онлайн'}
<b>Анонимный заказ:</b> ${anonymousText}
<b>Связь через WhatsApp:</b> ${whatsappText}
<b>Текст открытки:</b> ${postcardTextMessage}
${promoText}

<b>Основные товары:</b>
${itemsList}

<b>Дополнения:</b>
${upsellList}`;

  // Отправляем сообщение в Telegram
  const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  if (!telegramResponse.ok) {
    console.error('Error sending Telegram message:', await telegramResponse.text());
    return NextResponse.json({ error: 'Ошибка отправки уведомления' }, { status: 500 });
  }

  return NextResponse.json({ success: true, order_id: order.order_number });
}