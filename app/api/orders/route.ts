// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone } from '@/lib/normalizePhone';
import { safeBody } from '@/lib/api/safeBody';
import { Prisma } from '@prisma/client';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

interface OrderRequest {
  phone: string;
  name: string;
  recipient: string;
  recipientPhone: string;
  address: string;
  deliveryMethod?: 'pickup' | 'delivery';
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

  bonuses_used?: number; // Int в prisma
  promo_id?: string; // Uuid
  promo_discount?: number; // Decimal в prisma
  delivery_instructions?: string;
  postcard_text?: string;
  anonymous?: boolean;
  whatsapp?: boolean;
}

export async function POST(req: Request) {
  try {
    const body = await safeBody<OrderRequest>(req, 'ORDERS API');
    if (body instanceof NextResponse) return body;

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
      anonymous = false,
      whatsapp = false,
    } = body;

    if (
      !rawPhone ||
      !name ||
      !recipient ||
      !rawRecipientPhone ||
      !address ||
      !date ||
      !time ||
      !payment ||
      !Array.isArray(cart) ||
      cart.length === 0 ||
      typeof total !== 'number' ||
      Number.isNaN(total)
    ) {
      return NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 });
    }

    // Телефон клиента
    const sanitizedPhoneInput = sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} });
    const sanitizedPhone = normalizePhone(sanitizedPhoneInput);

    if (!/^\+7\d{10}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 },
      );
    }

    // Телефон получателя
    const sanitizedRecipientPhoneInput = sanitizeHtml(rawRecipientPhone, {
      allowedTags: [],
      allowedAttributes: {},
    });
    const sanitizedRecipientPhone = normalizePhone(sanitizedRecipientPhoneInput);

    if (!/^\+7\d{10}$/.test(sanitizedRecipientPhone)) {
      return NextResponse.json(
        { error: 'Некорректный формат номера телефона получателя (должен быть +7XXXXXXXXXX)' },
        { status: 400 },
      );
    }

    const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
    const sanitizedRecipient = sanitizeHtml(recipient, { allowedTags: [], allowedAttributes: {} });
    const sanitizedAddress = sanitizeHtml(address, { allowedTags: [], allowedAttributes: {} });
    const sanitizedPayment = sanitizeHtml(payment, { allowedTags: [], allowedAttributes: {} });

    const sanitizedDeliveryInstructions = delivery_instructions
      ? sanitizeHtml(delivery_instructions, { allowedTags: [], allowedAttributes: {} })
      : null;

    const sanitizedPostcardText = postcard_text
      ? sanitizeHtml(postcard_text, { allowedTags: [], allowedAttributes: {} })
      : null;

    // user_profiles (в твоей схеме)
    const profile = await prisma.user_profiles.findUnique({
      where: { phone: sanitizedPhone },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Профиль с таким телефоном не найден' }, { status: 404 });
    }

    const user_id = profile.id;

    const regularItems = cart.filter((item) => !item.isUpsell);
    const upsellItems = cart.filter((item) => item.isUpsell);

    // Проверка основных товаров через Supabase (products)
    const productIds = regularItems
      .map((item) => {
        const id = parseInt(item.id, 10);
        return Number.isFinite(id) ? id : null;
      })
      .filter((id): id is number => id !== null);

    if (regularItems.length > 0 && productIds.length !== regularItems.length) {
      return NextResponse.json({ error: 'Некоторые ID товаров некорректны (не числа)' }, { status: 400 });
    }

    if (productIds.length > 0) {
      const { data: products, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, in_stock, is_visible')
        .in('id', productIds);

      if (productError) {
        process.env.NODE_ENV !== 'production' &&
          console.error('Supabase error fetching products:', productError);

        return NextResponse.json(
          { error: 'Ошибка получения товаров: ' + productError.message },
          { status: 500 },
        );
      }

      const invalidItems = regularItems.filter((item) => {
        const itemId = parseInt(item.id, 10);
        const product = products?.find((p: any) => p.id === itemId);
        if (!product) return true;
        if (!product.in_stock) return true;
        if (!product.is_visible) return true;
        return false;
      });

      if (invalidItems.length > 0) {
        const reasons = invalidItems.map((item) => {
          const itemId = parseInt(item.id, 10);
          const product = products?.find((p: any) => p.id === itemId);
          if (!product) return `Товар с ID ${itemId} не найден`;
          if (!product.in_stock) return `Товар с ID ${itemId} отсутствует в наличии`;
          if (!product.is_visible) return `Товар с ID ${itemId} не доступен для заказа`;
          return `Товар с ID ${itemId} недоступен`;
        });

        return NextResponse.json({ error: reasons.join('; ') }, { status: 400 });
      }
    }

    // delivery_method в prisma String? default("delivery")
    const finalDeliveryMethod: 'pickup' | 'delivery' =
      deliveryMethod || (sanitizedAddress === 'Самовывоз' ? 'pickup' : 'delivery');

    // total/promo_discount в prisma - Decimal
    const totalDecimal = new Prisma.Decimal(String(total));
    const promoDiscountDecimal = new Prisma.Decimal(String(promo_discount));

    // Создание заказа
    const order = await prisma.orders.create({
      data: {
        user_id,
        phone: sanitizedPhone,
        recipient_phone: sanitizedRecipientPhone,

        // В твоей схеме: есть name (String?), contact_name (String?), recipient (String), address (String)
        name: sanitizedName,
        contact_name: sanitizedName,
        recipient: sanitizedRecipient,
        address: sanitizedAddress,

        delivery_method: finalDeliveryMethod,
        delivery_date: date,
        delivery_time: time,
        payment_method: sanitizedPayment,

        total: totalDecimal,
        bonuses_used: Number.isFinite(bonuses_used) ? bonuses_used : 0,
        bonus: 0,

        promo_id: promo_id || null,
        promo_discount: promoDiscountDecimal,

        status: 'pending',
        delivery_instructions: sanitizedDeliveryInstructions,
        postcard_text: sanitizedPostcardText,
        anonymous,
        whatsapp,

        items: regularItems as any,
        upsell_details: upsellItems as any,
      },
      select: { id: true, order_number: true, items: true, upsell_details: true },
    });

    // order_items
    const orderItems = regularItems
      .map((item) => ({
        order_id: order.id,
        product_id: parseInt(item.id, 10),
        quantity: item.quantity,
        price: item.price,
      }))
      .filter((x) => Number.isFinite(x.product_id));

    if (orderItems.length > 0) {
      try {
        await prisma.order_items.createMany({ data: orderItems });
      } catch (itemError: any) {
        process.env.NODE_ENV !== 'production' &&
          console.error('[order_items error]', itemError.message);
      }
    }

    // PROMO used_count (если применен)
    let promoError: string | null = null;
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

    // Telegram (одно место отправки)
    let telegramError: string | null = null;

    const regularList = regularItems.length
      ? regularItems
          .map(
            (i) =>
              `• ${sanitizeHtml(i.title, { allowedTags: [] })} ×${i.quantity} — ${i.price * i.quantity}₽`,
          )
          .join('\n')
      : 'Нет основных товаров';

    const upsellList = upsellItems.length
      ? upsellItems
          .map(
            (i) =>
              `• ${sanitizeHtml(i.title, { allowedTags: [] })} (${i.category || 'доп.'}) ×${i.quantity} — ${
                i.price * i.quantity
              }₽`,
          )
          .join('\n')
      : 'Нет дополнений';

    const deliveryMethodText = finalDeliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка';
    const promoText = promo_id
      ? `<b>Промокод:</b> Применён (скидка: ${promo_discount}₽)`
      : `<b>Промокод:</b> Не применён`;

    const message = `<b>🆕 Новый заказ #${order.order_number}</b>
<b>Сумма:</b> ${total} ₽
<b>Бонусы списано:</b> ${bonuses_used}
<b>Дата/время:</b> ${date} ${time}
<b>Способ доставки:</b> ${deliveryMethodText}
<b>Анонимный заказ:</b> ${anonymous ? 'Да' : 'Нет'}
<b>Связь по WhatsApp:</b> ${whatsapp ? 'Да (можно писать клиенту в WhatsApp)' : 'Не указано'}
<b>Оплата:</b> ${payment === 'cash' ? 'Наличные' : 'Онлайн'}
${promoText}

<b>Основные товары:</b>
${regularList}

<b>Дополнения:</b>
${upsellList}`;

    try {
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
        telegramError = await telegramResponse.text();
        process.env.NODE_ENV !== 'production' && console.error('[Telegram error]', telegramError);
      }
    } catch (e: any) {
      telegramError = e.message;
      process.env.NODE_ENV !== 'production' && console.error('[Telegram send error]', telegramError);
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      user_id,
      items: order.items,
      upsell_details: order.upsell_details,
      tracking_url: `/account/orders/${order.id}`,
      telegramError,
      promoError,
    });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('[ORDER API ERROR]', error, error?.stack);
    return NextResponse.json({ error: 'Ошибка сервера: ' + error.message }, { status: 500 });
  }
}
