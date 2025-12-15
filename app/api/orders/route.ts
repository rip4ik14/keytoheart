import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import sanitizeHtml from 'sanitize-html';

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
  promo_id?: string;
  promo_discount?: number;
  delivery_instructions?: string;
  postcard_text?: string;
  anonymous?: boolean;
  whatsapp?: boolean;
}

// Тип для результата запроса products
interface Product {
  id: number;
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
      promo_id,
      promo_discount = 0,
      delivery_instructions,
      postcard_text,
      anonymous,
      whatsapp,
    } = body;

    // Валидация обязательных полей
    if (!rawPhone || !name || !recipient || !address || !total || !cart || !rawRecipientPhone) {
      return NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 });
    }

    // Нормализация и валидация телефона
    const sanitizedPhone = normalizePhone(sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} }));
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }
    // Нормализация и валидация телефона получателя
    const sanitizedRecipientPhone = normalizePhone(sanitizeHtml(rawRecipientPhone, { allowedTags: [], allowedAttributes: {} }));
    if (!sanitizedRecipientPhone || !/^\+7\d{10}$/.test(sanitizedRecipientPhone)) {
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

    // Проверка профиля пользователя
    const profile = await prisma.user_profiles.findUnique({
      where: { phone: sanitizedPhone },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль с таким телефоном не найден' },
        { status: 404 }
      );
    }

    const user_id = profile.id;

    // Разделяем основные товары и upsell-дополнения
    const regularItems = cart.filter((item) => !item.isUpsell);
    const upsellItems = cart.filter((item) => item.isUpsell);

    // Проверяем, что все product_id для основных товаров существуют в Supabase
    const productIds = regularItems
      .map((item) => {
        const id = parseInt(item.id, 10);
        return isNaN(id) ? null : id;
      })
      .filter((id): id is number => id !== null);

    if (productIds.length !== regularItems.length && regularItems.length > 0) {
      return NextResponse.json(
        { error: 'Некоторые ID товаров некорректны (не числа)' },
        { status: 400 }
      );
    }

    if (productIds.length > 0) {
      const { data: products, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, in_stock, is_visible')
        .in('id', productIds);

      if (productError) {
        process.env.NODE_ENV !== "production" && console.error('Supabase error fetching products:', productError);
        return NextResponse.json(
          { error: 'Ошибка получения товаров: ' + productError.message },
          { status: 500 }
        );
      }

      const invalidItems = regularItems.filter((item) => {
        const itemId = parseInt(item.id, 10);
        const product = products.find((p: any) => p.id === itemId);
        if (!product) return true; // Товар не найден
        if (!product.in_stock) return true; // Товар отсутствует в наличии
        if (!product.is_visible) return true; // Товар не доступен для заказа
        return false;
      });

      if (invalidItems.length > 0) {
        const reasons = invalidItems.map((item) => {
          const itemId = parseInt(item.id, 10);
          const product = products.find((p: any) => p.id === itemId);
          if (!product) return `Товар с ID ${itemId} не найден`;
          if (!product.in_stock) return `Товар с ID ${itemId} отсутствует в наличии`;
          if (!product.is_visible) return `Товар с ID ${itemId} не доступен для заказа`;
          return `Товар с ID ${itemId} недоступен`;
        });
        return NextResponse.json(
          { error: reasons.join('; ') },
          { status: 400 }
        );
      }
    }

    // Генерируем order_number (используем автоинкремент из базы)
    const order = await prisma.orders.create({
      data: {
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
        bonus: 0, // Бонусы не начисляем при создании
        promo_id,
        promo_discount,
        status: 'pending',
        created_at: new Date(),
        delivery_instructions: sanitizedDeliveryInstructions,
        postcard_text: sanitizedPostcardText,
        anonymous,
        whatsapp,
        items: regularItems,
        upsell_details: upsellItems,
      },
      select: { id: true, order_number: true, items: true, upsell_details: true },
    });

    // Сохраняем основные товары в order_items
    const orderItems = regularItems.map((item) => ({
      order_id: order.id,
      product_id: parseInt(item.id, 10),
      quantity: item.quantity,
      price: item.price,
    }));

    if (orderItems.length > 0) {
      try {
        await prisma.order_items.createMany({
          data: orderItems,
        });
      } catch (itemError: any) {
        process.env.NODE_ENV !== "production" && console.error('[order_items error]', itemError.message);
      }
    }

    const baseUrl = new URL(req.url).origin;

    // --- Побочные ошибки ловим отдельно ---
    let redeemBonusError: string | null = null;
    let promoError: string | null = null;
    let telegramError: string | null = null;

    // Списание бонусов
    if (bonuses_used > 0) {
      try {
        const res = await fetch(`${baseUrl}/api/redeem-bonus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: sanitizedPhone, amount: bonuses_used, order_id: order.id }),
        });
        if (!res.ok) {
          redeemBonusError = await res.text();
        }
      } catch (e: any) {
        redeemBonusError = e.message;
      }
    }

    // Обновление промокода (использований)
    if (promo_id) {
      try {
        const promoData = await prisma.promo_codes.findUnique({
          where: { id: promo_id },
          select: { used_count: true },
        });
        if (promoData) {
          await prisma.promo_codes.update({
            where: { id: promo_id },
            data: { used_count: (promoData.used_count || 0) + 1 },
          });
        } else {
          promoError = 'Промокод не найден';
        }
      } catch (e: any) {
        promoError = e.message;
      }
    }

    // Формируем сообщение для Telegram (без ПДн)
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
    const message = `<b>🆕 Новый заказ #${order.order_number}</b>
<b>Сумма:</b> ${total} ₽
<b>Бонусы списано:</b> ${bonuses_used}
<b>Дата/Время:</b> ${date} ${time}
<b>Способ доставки:</b> ${deliveryMethodText}
<b>Оплата:</b> ${payment === 'cash' ? 'Наличные' : 'Онлайн'}
${promoText}

<b>Основные товары:</b>
${itemsList}

<b>Дополнения:</b>
${upsellList}`;

    // Отправляем сообщение в Telegram (не роняем заказ)
    try {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );
      if (!telegramResponse.ok) {
        telegramError = await telegramResponse.text();
        process.env.NODE_ENV !== "production" && console.error('[Telegram error]', telegramError);
      }
    } catch (e: any) {
      telegramError = e.message;
      process.env.NODE_ENV !== "production" && console.error('[Telegram send error]', telegramError);
    }

    // Возвращаем всегда успех (даже если telegram/промо упали)
    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      user_id,
      items: order.items,
      upsell_details: order.upsell_details,
      tracking_url: `/account/orders/${order.id}`,
      telegramError,
      redeemBonusError,
      promoError,
    });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('[ORDER API ERROR]', error, error?.stack);
    return NextResponse.json(
      { error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}