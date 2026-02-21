// ✅ Путь: app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone } from '@/lib/normalizePhone';
import { safeBody } from '@/lib/api/safeBody';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const ORDER_WEBHOOK_URL = process.env.ORDER_WEBHOOK_URL || '';
const ORDER_WEBHOOK_SECRET = process.env.ORDER_WEBHOOK_SECRET || '';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'https://keytoheart.ru';

const TELEGRAM_TIMEOUT_MS = 8000;
const ORDER_WEBHOOK_TIMEOUT_MS = 8000;

type ContactMethod = 'call' | 'telegram' | 'whatsapp' | 'max';
const CONTACT_METHODS: ContactMethod[] = ['call', 'telegram', 'whatsapp', 'max'];

interface OrderRequest {
  phone: string;
  name?: string;
  recipient: string;

  occasion?: string | null;

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

    // допускаем любые доп поля (combo_id, base_price, discount_reason и т.д.)
    [key: string]: any;
  }>;

  total: number;

  bonuses_used?: number;
  promo_id?: string;
  promo_discount?: number;
  delivery_instructions?: string;
  postcard_text?: string;
  anonymous?: boolean;

  // legacy
  whatsapp?: boolean;

  // ✅ новое поле
  contact_method?: ContactMethod;
}

const digitsOnly = (v: string) => (v || '').replace(/\D/g, '');

function normalizePhoneRuHard(raw: string): string | null {
  const d = digitsOnly(raw);
  if (!d) return null;

  if (d.length >= 11 && (d.startsWith('7') || d.startsWith('8'))) {
    const local10 = d.slice(1, 11);
    return local10.length === 10 ? `+7${local10}` : null;
  }

  if (d.length > 10) {
    const local10 = d.slice(-10);
    return local10.length === 10 ? `+7${local10}` : null;
  }

  if (d.length === 10) return `+7${d}`;

  return null;
}

function normalizeContactMethod(input: unknown, legacyWhatsapp: boolean): ContactMethod {
  const v = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (CONTACT_METHODS.includes(v as ContactMethod)) return v as ContactMethod;
  return legacyWhatsapp ? 'whatsapp' : 'call';
}

// ⚠️ Telegram: не отправляем ПДн (телефоны, имена, адрес, комментарии).
function buildTelegramMessageSafe(params: {
  orderNumber: number | null;
  total: number;
  date: string;
  time: string;
  deliveryMethod: 'pickup' | 'delivery';
  payment: string;
  bonusesUsed: number;
  promoApplied: boolean;
  promoDiscount: number;
  regularItems: OrderRequest['items'];
  upsellItems: OrderRequest['items'];
  contactMethod: ContactMethod;
}) {
  const {
    orderNumber,
    total,
    date,
    time,
    deliveryMethod,
    payment,
    bonusesUsed,
    promoApplied,
    promoDiscount,
    regularItems,
    upsellItems,
    contactMethod,
  } = params;

  const safeLine = (s: string) => sanitizeHtml(s || '', { allowedTags: [], allowedAttributes: {} });

  const regularList = regularItems.length
    ? regularItems
        .map((i) => {
          const title = safeLine(i.title);
          const q = Number.isFinite(i.quantity) ? i.quantity : 1;
          const price = Number.isFinite(i.price) ? i.price : 0;
          return `• ${title} ×${q} - ${price * q}₽`;
        })
        .join('\n')
    : 'Нет основных товаров';

  const upsellList = upsellItems.length
    ? upsellItems
        .map((i) => {
          const title = safeLine(i.title);
          const cat = safeLine(i.category || 'доп.');
          const q = Number.isFinite(i.quantity) ? i.quantity : 1;
          const price = Number.isFinite(i.price) ? i.price : 0;
          return `• ${title} (${cat}) ×${q} - ${price * q}₽`;
        })
        .join('\n')
    : 'Нет дополнений';

  const deliveryMethodText = deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка';
  const paymentText = payment === 'cash' ? 'Наличные' : 'Онлайн';

  const promoText = promoApplied
    ? `<b>Промо:</b> применён (скидка: ${promoDiscount}₽)`
    : `<b>Промо:</b> не применён`;

  const contactText =
    contactMethod === 'whatsapp'
      ? 'WhatsApp'
      : contactMethod === 'telegram'
        ? 'Telegram'
        : contactMethod === 'max'
          ? 'MAX'
          : 'Звонок';

  const num = orderNumber ? `#${orderNumber}` : 'без номера';
  const adminLink = orderNumber
    ? `${BASE_URL}/admin/orders?search=${encodeURIComponent(String(orderNumber))}`
    : `${BASE_URL}/admin/orders`;

  return `<b>🆕 Новый заказ ${num}</b>
<b>Сумма:</b> ${total} ₽
<b>Связь:</b> ${contactText}
<b>Бонусы списано:</b> ${bonusesUsed}
<b>Дата/время:</b> ${safeLine(date)} ${safeLine(time)}
<b>Доставка:</b> ${deliveryMethodText}
<b>Оплата:</b> ${paymentText}
${promoText}

<b>Основные товары:</b>
${regularList}

<b>Дополнения:</b>
${upsellList}

<b>Открыть в админке:</b> ${adminLink}`;
}

async function sendTelegramMessageSafe(text: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return { ok: false, error: 'Missing TELEGRAM env' };

  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!telegramResponse.ok) {
      const body = await telegramResponse.text().catch(() => '');
      return { ok: false, error: body || `Telegram HTTP ${telegramResponse.status}`, ms: Date.now() - started };
    }

    return { ok: true, error: null, ms: Date.now() - started };
  } catch (e: any) {
    const msg =
      e?.name === 'AbortError' ? `Telegram timeout ${TELEGRAM_TIMEOUT_MS}ms` : e?.message || 'Telegram send failed';
    return { ok: false, error: msg, ms: Date.now() - started };
  } finally {
    clearTimeout(t);
  }
}

async function sendOrderWebhookSafe(params: {
  orderNumber: number | null;
  total: number;
  date: string;
  time: string;
  deliveryMethod: 'pickup' | 'delivery';
  payment: string;
  bonusesUsed: number;
  promoApplied: boolean;
  promoDiscount: number;
  regularItems: OrderRequest['items'];
  upsellItems: OrderRequest['items'];
  contactMethod: ContactMethod;
}) {
  if (!ORDER_WEBHOOK_URL) return { ok: false, error: 'Missing ORDER_WEBHOOK_URL' };

  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ORDER_WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(ORDER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ORDER_WEBHOOK_SECRET ? { 'x-order-webhook-secret': ORDER_WEBHOOK_SECRET } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        source: 'orders',
        created_at: new Date().toISOString(),
        order_number: params.orderNumber,
        total: params.total,
        date: params.date,
        time: params.time,
        delivery_method: params.deliveryMethod,
        payment: params.payment,
        bonuses_used: params.bonusesUsed,
        promo_applied: params.promoApplied,
        promo_discount: params.promoDiscount,
        contact_method: params.contactMethod,
        regular_items: params.regularItems.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          category: item.category ?? null,
        })),
        upsell_items: params.upsellItems.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          category: item.category ?? null,
        })),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return { ok: false, error: body || `Webhook HTTP ${response.status}`, ms: Date.now() - started };
    }

    return { ok: true, error: null, ms: Date.now() - started };
  } catch (e: any) {
    const msg =
      e?.name === 'AbortError' ? `Webhook timeout ${ORDER_WEBHOOK_TIMEOUT_MS}ms` : e?.message || 'Webhook send failed';
    return { ok: false, error: msg, ms: Date.now() - started };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await safeBody<OrderRequest>(req, 'ORDERS API');
    if (body instanceof NextResponse) return body;

    const {
      phone: rawPhone,
      name = '',
      recipient,

      occasion = null,

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
      contact_method,
    } = body;

    if (
      !rawPhone ||
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

    const finalContactMethod = normalizeContactMethod(contact_method, !!whatsapp);
    if (!CONTACT_METHODS.includes(finalContactMethod)) {
      return NextResponse.json({ error: 'Некорректный contact_method' }, { status: 400 });
    }

    const sanitizedPhoneInput = sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} });
    const sanitizedPhone = normalizePhoneRuHard(normalizePhone(sanitizedPhoneInput)) || '';

    if (!/^\+7\d{10}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 },
      );
    }

    const sanitizedRecipientPhoneInput = sanitizeHtml(rawRecipientPhone, {
      allowedTags: [],
      allowedAttributes: {},
    });
    const sanitizedRecipientPhone = normalizePhoneRuHard(normalizePhone(sanitizedRecipientPhoneInput)) || '';

    if (!/^\+7\d{10}$/.test(sanitizedRecipientPhone)) {
      return NextResponse.json(
        { error: 'Некорректный формат номера телефона получателя (должен быть +7XXXXXXXXXX)' },
        { status: 400 },
      );
    }

    const sanitizedName = sanitizeHtml(name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedRecipient = sanitizeHtml(recipient, { allowedTags: [], allowedAttributes: {} });
    const sanitizedAddress = sanitizeHtml(address, { allowedTags: [], allowedAttributes: {} });
    const sanitizedPayment = sanitizeHtml(payment, { allowedTags: [], allowedAttributes: {} });

    const sanitizedOccasionRaw = occasion
      ? sanitizeHtml(String(occasion), { allowedTags: [], allowedAttributes: {} })
      : '';
    const sanitizedOccasion = sanitizedOccasionRaw.trim() ? sanitizedOccasionRaw.trim() : null;

    const sanitizedDeliveryInstructions = delivery_instructions
      ? sanitizeHtml(delivery_instructions, { allowedTags: [], allowedAttributes: {} })
      : null;

    const sanitizedPostcardText = postcard_text
      ? sanitizeHtml(postcard_text, { allowedTags: [], allowedAttributes: {} })
      : null;

    // ✅ user_profiles
    const profile = await prisma.user_profiles.upsert({
      where: { phone: sanitizedPhone },
      create: {
        phone: sanitizedPhone,
        name: sanitizedName || null,
      } as any,
      update: {
        ...(sanitizedName ? { name: sanitizedName } : {}),
      } as any,
      select: { id: true },
    });

    const user_id = profile.id;

    const regularItems = cart.filter((item) => !item.isUpsell);
    const upsellItems = cart.filter((item) => item.isUpsell);

    // ✅ валидация товаров по Supabase (каталог)
    const productIds = regularItems
      .map((item) => {
        const id = parseInt(String(item.id), 10);
        return Number.isFinite(id) ? id : null;
      })
      .filter((id): id is number => id !== null);

    // если в корзине есть "нечисловые" id - просто не валим заказ, а пропускаем supabase-валидацию
    // (на будущее можно ужесточить, но сейчас цель - чтобы заказ проходил)
    if (productIds.length > 0) {
      const { data: products, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, in_stock, is_visible')
        .in('id', productIds);

      if (productError) {
        console.error(`[ORDERS][${requestId}] Supabase error fetching products:`, productError);
        return NextResponse.json({ error: 'Ошибка получения товаров: ' + productError.message }, { status: 500 });
      }

      const invalidItems = regularItems.filter((item) => {
        const itemId = parseInt(String(item.id), 10);
        if (!Number.isFinite(itemId)) return false; // не валим заказ на этом
        const product = products?.find((p: any) => p.id === itemId);
        if (!product) return true;
        if (!product.in_stock) return true;
        if (!product.is_visible) return true;
        return false;
      });

      if (invalidItems.length > 0) {
        const reasons = invalidItems.map((item) => {
          const itemId = parseInt(String(item.id), 10);
          const product = products?.find((p: any) => p.id === itemId);
          if (!product) return `Товар с ID ${itemId} не найден`;
          if (!product.in_stock) return `Товар с ID ${itemId} отсутствует в наличии`;
          if (!product.is_visible) return `Товар с ID ${itemId} не доступен для заказа`;
          return `Товар с ID ${itemId} недоступен`;
        });

        return NextResponse.json({ error: reasons.join('; ') }, { status: 400 });
      }
    }

    const finalDeliveryMethod: 'pickup' | 'delivery' =
      deliveryMethod || (sanitizedAddress === 'Самовывоз' ? 'pickup' : 'delivery');

    const totalDecimal = new Prisma.Decimal(String(total));
    const promoDiscountDecimal = new Prisma.Decimal(String(promo_discount));

    const order = await prisma.orders.create({
      data: {
        user_id,
        phone: sanitizedPhone,
        recipient_phone: sanitizedRecipientPhone,

        name: sanitizedName || null,
        contact_name: sanitizedName || null,

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

        contact_method: finalContactMethod,
        whatsapp: finalContactMethod === 'whatsapp',

        occasion: sanitizedOccasion,

        // ✅ главное - состав заказа храним тут (json)
        items: regularItems as any,
        upsell_details: upsellItems as any,
      },
      select: { id: true, order_number: true, items: true, upsell_details: true },
    });

    // ✅ A-фикс: НЕ создаём order_items вообще
    // Причина: FK на products (Prisma) ломается, т.к. каталог в Supabase.
    // Аналитика по товарам - сделаем позже отдельной задачей без FK.

    // ✅ промокод: used_count++
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
        promoError = e?.message || 'Promo update error';
        console.error(`[ORDERS][${requestId}] Promo update error:`, promoError);
      }
    }

    // ✅ уведомления - не мешают оформлению
    try {
      const safeNotificationParams = {
        orderNumber: order.order_number ?? null,
        total,
        date,
        time,
        deliveryMethod: finalDeliveryMethod,
        payment,
        bonusesUsed: Number.isFinite(bonuses_used) ? bonuses_used : 0,
        promoApplied: !!promo_id,
        promoDiscount: Number.isFinite(promo_discount) ? promo_discount : 0,
        regularItems,
        upsellItems,
        contactMethod: finalContactMethod,
      };

      const tgText = buildTelegramMessageSafe(safeNotificationParams);

      const [telegramRes, webhookRes] = await Promise.allSettled([
        sendTelegramMessageSafe(tgText),
        sendOrderWebhookSafe(safeNotificationParams),
      ]);

      if (telegramRes.status === 'fulfilled') {
        if (!telegramRes.value.ok) {
          console.error(
            `[ORDERS][${requestId}] Telegram failed for order ${order.order_number ?? 'n/a'}: ${telegramRes.value.error} (ms=${telegramRes.value.ms ?? 'n/a'})`,
          );
        }
      } else {
        console.error(
          `[ORDERS][${requestId}] Telegram unexpected error for order ${order.order_number ?? 'n/a'}: ${telegramRes.reason?.message || telegramRes.reason}`,
        );
      }

      if (webhookRes.status === 'fulfilled') {
        if (!webhookRes.value.ok) {
          console.error(
            `[ORDERS][${requestId}] Webhook failed for order ${order.order_number ?? 'n/a'}: ${webhookRes.value.error} (ms=${webhookRes.value.ms ?? 'n/a'})`,
          );
        }
      } else {
        console.error(
          `[ORDERS][${requestId}] Webhook unexpected error for order ${order.order_number ?? 'n/a'}: ${webhookRes.reason?.message || webhookRes.reason}`,
        );
      }
    } catch (e: any) {
      console.error(`[ORDERS][${requestId}] [Notification build error]`, e?.message || e);
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      user_id,
      items: order.items,
      upsell_details: order.upsell_details,
      tracking_url: `/account/orders/${order.id}`,
      promoError,
    });
  } catch (error: any) {
    console.error(`[ORDERS][${requestId}] [ORDER API ERROR]`, error, error?.stack);
    return NextResponse.json({ error: 'Ошибка сервера: ' + (error?.message || String(error)) }, { status: 500 });
  }
}