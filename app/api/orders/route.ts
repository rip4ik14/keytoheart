import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

// Тип для данных, получаемых из запроса
interface OrderRequest {
  phone: string;
  name: string;
  recipient: string;
  recipientPhone: string;
  address: string;
  deliveryMethod: string;
  date: string;
  time: string;
  payment: string;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    isUpsell?: boolean;
    category?: string;
  }>;
  total: number;
  bonuses_used?: number;
  bonus?: number;
  promo_id?: string;
  promo_discount?: number;
  delivery_instructions?: string;
  postcard_text?: string;
  anonymous?: boolean;
  whatsapp?: boolean;
}

// Функция для нормализации телефона
const normalizePhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('7')) {
    return `+${cleanPhone}`;
  } else if (cleanPhone.length === 10) {
    return `+7${cleanPhone}`;
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('8')) {
    return `+7${cleanPhone.slice(1)}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('7')) {
    return `+${cleanPhone}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
};

// Функция для экранирования HTML-символов в Telegram-сообщении
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
};

export async function POST(req: Request) {
  try {
    const body: OrderRequest = await req.json();
    const {
      phone: rawPhone,
      name,
      recipient,
      recipientPhone: rawRecipientPhone,
      address,
      deliveryMethod,
      date,
      time,
      payment,
      items: cart,
      total,
      bonuses_used = 0,
      bonus: initialBonus = 0,
      promo_id,
      promo_discount = 0,
      delivery_instructions,
      postcard_text,
      anonymous,
      whatsapp,
    } = body;

    console.log(`[${new Date().toISOString()}] Received payload:`, body);

    // Валидация обязательных полей
    if (!rawPhone || !name || !recipient || !address || !total || !cart || !rawRecipientPhone) {
      console.error(`[${new Date().toISOString()}] Missing required fields:`, {
        phone: rawPhone,
        name,
        recipient,
        recipientPhone: rawRecipientPhone,
        address,
        total,
        cart,
      });
      return NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 });
    }

    // Нормализация и валидация телефона
    const sanitizedPhone = normalizePhone(sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} }));
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      console.error(`[${new Date().toISOString()}] Invalid phone format:`, { phone: sanitizedPhone });
      return NextResponse.json(
        { error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Нормализация и валидация телефона получателя
    const sanitizedRecipientPhone = normalizePhone(sanitizeHtml(rawRecipientPhone, { allowedTags: [], allowedAttributes: {} }));
    if (!sanitizedRecipientPhone || !/^\+7\d{10}$/.test(sanitizedRecipientPhone)) {
      console.error(`[${new Date().toISOString()}] Invalid recipient phone format:`, { recipientPhone: sanitizedRecipientPhone });
      return NextResponse.json(
        { error: 'Некорректный формат номера телефона получателя (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Санитизация текстовых полей
    const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
    const sanitizedRecipient = sanitizeHtml(recipient, { allowedTags: [], allowedAttributes: {} });
    const sanitizedAddress = sanitizeHtml(address, { allowedTags: [], allowedAttributes: {} });
    const sanitizedDeliveryInstructions = delivery_instructions
      ? sanitizeHtml(delivery_instructions, { allowedTags: [], allowedAttributes: {} })
      : null;
    const sanitizedPostcardText = postcard_text
      ? sanitizeHtml(postcard_text, { allowedTags: [], allowedAttributes: {} })
      : null;

    // Логирование санитизированных данных
    console.log(`[${new Date().toISOString()}] Sanitized order data:`, {
      phone: sanitizedPhone,
      recipientPhone: sanitizedRecipientPhone,
      name: sanitizedName,
      recipient: sanitizedRecipient,
      address: sanitizedAddress,
      delivery_instructions: sanitizedDeliveryInstructions,
      postcard_text: sanitizedPostcardText,
    });

    // Проверка профиля пользователя
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', sanitizedPhone)
      .single();

    if (profileError || !profile) {
      console.error(`[${new Date().toISOString()}] Profile not found for phone:`, sanitizedPhone);
      return NextResponse.json(
        { error: 'Профиль с таким телефоном не найден' },
        { status: 404 }
      );
    }

    const user_id = profile.id;

    // Разделяем основные товары и upsell-дополнения
    const regularItems = cart.filter((item) => !item.isUpsell);
    const upsellItems = cart.filter((item) => item.isUpsell);

    // Проверяем, что все product_id для основных товаров существуют в таблице products
    const productIds = regularItems
      .map((item) => parseInt(item.id, 10))
      .filter((id: number) => !isNaN(id));

    if (productIds.length !== regularItems.length && regularItems.length > 0) {
      console.error(`[${new Date().toISOString()}] Invalid product IDs (not numbers):`, regularItems);
      return NextResponse.json(
        { error: 'Некоторые ID товаров некорректны (не числа)' },
        { status: 400 }
      );
    }

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds);

      if (productsError) {
        console.error(`[${new Date().toISOString()}] Error checking products:`, productsError);
        return NextResponse.json({ error: 'Ошибка проверки товаров' }, { status: 500 });
      }

      const existingProductIds = new Set(products.map((p: any) => p.id));
      const invalidItems = regularItems.filter((item) => !existingProductIds.has(parseInt(item.id, 10)));
      if (invalidItems.length > 0) {
        console.error(`[${new Date().toISOString()}] Invalid product IDs:`, invalidItems);
        return NextResponse.json(
          { error: `Товары с ID ${invalidItems.map((i: any) => i.id).join(', ')} не найдены` },
          { status: 400 }
        );
      }
    }

    // Сохраняем заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          phone: sanitizedPhone,
          recipient_phone: sanitizedRecipientPhone,
          contact_name: sanitizedName,
          recipient: sanitizedRecipient,
          address: sanitizedAddress,
          delivery_method: deliveryMethod,
          delivery_date: date,
          delivery_time: time,
          payment_method: payment,
          total,
          bonuses_used,
          bonus: 0,
          promo_id,
          promo_discount,
          status: 'pending',
          created_at: new Date().toISOString(),
          delivery_instructions: sanitizedDeliveryInstructions,
          postcard_text: sanitizedPostcardText,
          anonymous,
          whatsapp,
          upsell_details: upsellItems.map((item) => ({
            title: sanitizeHtml(item.title, { allowedTags: [], allowedAttributes: {} }),
            price: item.price,
            quantity: item.quantity,
            category: item.category,
          })),
        },
      ])
      .select('id, order_number')
      .single();

    if (orderError || !order) {
      console.error(`[${new Date().toISOString()}] Error saving order:`, orderError);
      return NextResponse.json(
        { error: 'Ошибка сохранения заказа: ' + (orderError?.message || 'Неизвестная ошибка') },
        { status: 500 }
      );
    }

    console.log(`[${new Date().toISOString()}] Successfully saved order:`, { id: order.id, order_number: order.order_number });

    // Сохраняем основные товары в order_items
    const orderItems = regularItems.map((item) => ({
      order_id: order.id,
      product_id: parseInt(item.id, 10),
      quantity: item.quantity,
      price: item.price,
    }));

    if (orderItems.length > 0) {
      const { error: itemError } = await supabase.from('order_items').insert(orderItems);
      if (itemError) {
        console.error(`[${new Date().toISOString()}] Error saving order items:`, itemError);
        return NextResponse.json(
          { error: 'Ошибка сохранения товаров: ' + itemError.message },
          { status: 500 }
        );
      }
      console.log(`[${new Date().toISOString()}] Successfully saved order items:`, orderItems);
    } else {
      console.log(`[${new Date().toISOString()}] No regular items to save in order_items`);
    }

    const baseUrl = new URL(req.url).origin;

    // Обработка списания бонусов
    if (bonuses_used > 0) {
      const res = await fetch(`${baseUrl}/api/redeem-bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sanitizedPhone, amount: bonuses_used, order_id: order.id }), // Используем phone вместо user_id
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[${new Date().toISOString()}] Error redeeming bonuses:`, errorText);
      } else {
        console.log(`[${new Date().toISOString()}] Successfully redeemed bonuses:`, bonuses_used);
      }
    }

    // Начисление бонусов
    console.log(`[${new Date().toISOString()}] Attempting to credit bonuses:`, { phone: sanitizedPhone, order_total: total, order_id: order.id });
    const resBonus = await fetch(`${baseUrl}/api/order-bonus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: sanitizedPhone, order_total: total, order_id: order.id }), // Используем phone вместо user_id
    });

    let bonusResult;
    if (resBonus.ok) {
      bonusResult = await resBonus.json();
      console.log(`[${new Date().toISOString()}] Successfully credited bonuses:`, bonusResult);
    } else {
      const errorText = await resBonus.text();
      console.error(`[${new Date().toISOString()}] Error crediting bonuses:`, errorText);
      return NextResponse.json(
        { success: false, error: 'Ошибка начисления бонусов: ' + errorText },
        { status: 500 }
      );
    }

    // Обновляем заказ с начисленным количеством бонусов
    const bonusAdded = bonusResult.bonus_added || 0;
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ bonus: bonusAdded })
      .eq('id', order.id);

    if (updateOrderError) {
      console.error(`[${new Date().toISOString()}] Error updating order with bonus:`, updateOrderError);
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления заказа с бонусами: ' + updateOrderError.message },
        { status: 500 }
      );
    }
    console.log(`[${new Date().toISOString()}] Successfully updated order with bonus:`, bonusAdded);

    // Обновление промокода
    if (promo_id) {
      console.log(`[${new Date().toISOString()}] Updating promo code usage:`, { promo_id });
      const { data: promoData, error: promoFetchError } = await supabase
        .from('promo_codes')
        .select('used_count')
        .eq('id', promo_id)
        .single();

      if (promoFetchError || !promoData) {
        console.error(`[${new Date().toISOString()}] Error fetching promo code:`, promoFetchError?.message);
      } else {
        const newUsedCount = (promoData.used_count || 0) + 1;
        const { error: promoUpdateError } = await supabase
          .from('promo_codes')
          .update({ used_count: newUsedCount })
          .eq('id', promo_id);
        if (promoUpdateError) {
          console.error(`[${new Date().toISOString()}] Error updating promo code:`, promoUpdateError.message);
        } else {
          console.log(`[${new Date().toISOString()}] Successfully updated promo code usage:`, { promo_id, newUsedCount });
        }
      }
    }

    // Формируем сообщение для Telegram
    const itemsList = regularItems.length
      ? regularItems.map((i) => `• ${sanitizeHtml(i.title, { allowedTags: [] })} ×${i.quantity} — ${i.price * i.quantity}₽`).join('\n')
      : 'Нет основных товаров';
    const upsellList = upsellItems.length
      ? upsellItems.map((i) => `• ${sanitizeHtml(i.title, { allowedTags: [] })} (${i.category}) ×${i.quantity} — ${i.price}₽`).join('\n')
      : 'Нет дополнений';
    const deliveryMethodText = deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка';
    const promoText = promo_id
      ? `<b>Промокод:</b> Применён (скидка: ${promo_discount}₽)`
      : `<b>Промокод:</b> Не применён`;
    const anonymousText = anonymous ? 'Да' : 'Нет';
    const whatsappText = whatsapp ? 'Да' : 'Нет';
    const postcardTextMessage = sanitizedPostcardText || 'Не указан';
    const message = `<b>🆕 Новый заказ #${order.order_number}</b>
<b>Имя:</b> ${escapeHtml(sanitizedName)}
<b>Телефон:</b> ${escapeHtml(sanitizedPhone)}
<b>Телефон получателя:</b> ${escapeHtml(sanitizedRecipientPhone)}
<b>Сумма:</b> ${total} ₽
<b>Бонусы списано:</b> ${bonuses_used}
<b>Бонусы начислено:</b> ${bonusAdded}
<b>Дата/Время:</b> ${date} ${time}
<b>Способ доставки:</b> ${deliveryMethodText}
<b>Адрес:</b> ${escapeHtml(sanitizedAddress || 'Не указан (самовывоз)')}
<b>Получатель:</b> ${escapeHtml(sanitizedRecipient)}
<b>Оплата:</b> ${payment === 'cash' ? 'Наличные' : 'Онлайн'}
<b>Анонимный заказ:</b> ${anonymousText}
<b>Связь через WhatsApp:</b> ${whatsappText}
<b>Текст открытки:</b> ${escapeHtml(postcardTextMessage)}
${promoText}

<b>Основные товары:</b>
${itemsList}

<b>Дополнения:</b>
${upsellList}`;

    // Отправляем сообщение в Telegram
    console.log(`[${new Date().toISOString()}] Sending Telegram message:`, message);
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
      const telegramError = await telegramResponse.text();
      console.error(`[${new Date().toISOString()}] Error sending Telegram message:`, telegramError);
      return NextResponse.json(
        { error: 'Ошибка отправки уведомления в Telegram: ' + telegramError },
        { status: 500 }
      );
    }

    console.log(`[${new Date().toISOString()}] Successfully sent Telegram notification for order:`, order.order_number);
    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      user_id,
      tracking_url: `/account/orders/${order.id}`,
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error processing order:`, error);
    return NextResponse.json(
      { error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}