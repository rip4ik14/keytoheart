// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

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

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '+7' + digits.slice(-10);
  }
  return raw.startsWith('+') ? raw : '+' + raw;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as OrderRequest;
    const {
      phone: rawPhone,
      name,
      recipient,
      recipientPhone: rawRecipient,
      address,
      deliveryMethod,
      date,
      time,
      payment,
      items,
      total,
      bonuses_used = 0,
      promo_id,
      promo_discount = 0,
      delivery_instructions,
      postcard_text,
      anonymous = false,
      whatsapp = false,
    } = body;

    // обязательные поля
    if (!rawPhone || !name || !recipient || !address || !Array.isArray(items) || !total || !rawRecipient) {
      return NextResponse.json({ success: false, error: 'Отсутствуют обязательные поля' }, { status: 400 });
    }

    const phone = normalizePhone(sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} }));
    const recipientPhone = normalizePhone(sanitizeHtml(rawRecipient, { allowedTags: [], allowedAttributes: {} }));

    if (!/^\+7\d{10}$/.test(phone) || !/^\+7\d{10}$/.test(recipientPhone)) {
      return NextResponse.json({ success: false, error: 'Некорректный формат телефона' }, { status: 400 });
    }

    const cleanName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
    const cleanRecipientName = sanitizeHtml(recipient, { allowedTags: [], allowedAttributes: {} });
    const cleanAddress = sanitizeHtml(address, { allowedTags: [], allowedAttributes: {} });
    const cleanInstr = delivery_instructions
      ? sanitizeHtml(delivery_instructions, { allowedTags: [], allowedAttributes: {} })
      : null;
    const cleanPost = postcard_text
      ? sanitizeHtml(postcard_text, { allowedTags: [], allowedAttributes: {} })
      : null;

    // находим профиль
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ success: false, error: 'Профиль не найден' }, { status: 404 });
    }
    const user_id = profile.id;

    // разделяем товары
    const regular = items.filter(i => !i.isUpsell);
    const upsell = items.filter(i => i.isUpsell);

    // проверяем ID продуктов
    const productIds = regular.map(i => parseInt(i.id, 10)).filter(n => !isNaN(n));
    if (productIds.length !== regular.length) {
      return NextResponse.json({ success: false, error: 'Неверные ID товаров' }, { status: 400 });
    }
    if (productIds.length) {
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds);
      if (prodErr) throw prodErr;
      const exists = new Set(prods.map(p => p.id));
      const bad = regular.filter(i => !exists.has(parseInt(i.id, 10)));
      if (bad.length) {
        return NextResponse.json({
          success: false,
          error: `Продукты ${bad.map(i => i.id).join(', ')} не найдены`
        }, { status: 400 });
      }
    }

    // создаём заказ
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        user_id,
        phone,
        recipient_phone: recipientPhone,
        contact_name: cleanName,
        recipient: cleanRecipientName,
        address: cleanAddress,
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
        delivery_instructions: cleanInstr,
        postcard_text: cleanPost,
        anonymous,
        whatsapp,
        upsell_details: upsell.map(u => ({
          title: sanitizeHtml(u.title, { allowedTags: [], allowedAttributes: {} }),
          price: u.price,
          quantity: u.quantity,
          category: u.category,
        })),
      }])
      .select('id,order_number')
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ success: false, error: 'Не удалось сохранить заказ' }, { status: 500 });
    }

    // записываем обычные позиции
    if (regular.length) {
      const itemsToInsert = regular.map(i => ({
        order_id: order.id,
        product_id: parseInt(i.id, 10),
        quantity: i.quantity,
        price: i.price
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }

    const origin = new URL(req.url).origin;

    // списание бонусов
    if (bonuses_used > 0) {
      await fetch(`${origin}/api/redeem-bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: bonuses_used, order_id: order.id })
      });
    }

    // начисление бонусов
    const bonusRes = await fetch(`${origin}/api/order-bonus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, order_total: total, order_id: order.id })
    });
    const bonusJson = await bonusRes.json();
    const bonusAdded = bonusJson.bonus_added ?? 0;

    // обновляем заказ с бонусами
    await supabase
      .from('orders')
      .update({ bonus: bonusAdded })
      .eq('id', order.id);

    // отправляем в Telegram
    const txt = `<b>Новый заказ #${order.order_number}</b>\n` +
      `Имя: ${escapeHtml(cleanName)}\nТелефон: ${escapeHtml(phone)}\n` +
      `Сумма: ${total}₽\nБонусы списано: ${bonuses_used}\nБонусы начислено: ${bonusAdded}\n` +
      `Товары: ${regular.map(i => `${i.title}×${i.quantity}`).join(', ')}`;
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: txt, parse_mode: 'HTML' })
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number
    });
  } catch (err: any) {
    console.error('Order API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
