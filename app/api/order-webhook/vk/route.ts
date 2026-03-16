import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.ORDER_WEBHOOK_SECRET || '';
const VK_GROUP_TOKEN = process.env.VK_GROUP_TOKEN || '';
const VK_API_VERSION = process.env.VK_API_VERSION || '5.131';
const VK_PEER_IDS = process.env.VK_PEER_IDS || ''; // "43102831,189366737"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'https://keytoheart.ru';

type WebhookPayload = {
  order_number?: number | null;
  total?: number;
  date?: string;
  time?: string;
  delivery_method?: 'pickup' | 'delivery';
  payment?: string;
  bonuses_used?: number;
  promo_applied?: boolean;
  promo_discount?: number;
  regular_items?: Array<{ title: string; quantity: number; price: number; category?: string | null }>;
  upsell_items?: Array<{ title: string; quantity: number; price: number; category?: string | null }>;
};

function buildText(payload: WebhookPayload) {
  const orderNumber = payload.order_number ?? null;
  const numText = orderNumber ? `#${orderNumber}` : 'без номера';

  const adminLink = orderNumber
    ? `${BASE_URL}/admin/orders?search=${encodeURIComponent(String(orderNumber))}`
    : `${BASE_URL}/admin/orders`;

  const deliveryText = payload.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка';
  const paymentText = payload.payment === 'cash' ? 'Наличные' : 'Онлайн';

  const regular = payload.regular_items?.length
    ? payload.regular_items.map((i) => `- ${i.title} x${i.quantity} = ${i.price * i.quantity}₽`).join('\n')
    : 'Нет';

  const upsell = payload.upsell_items?.length
    ? payload.upsell_items.map((i) => `- ${i.title} x${i.quantity} = ${i.price * i.quantity}₽`).join('\n')
    : 'Нет';

  return [
    `🆕 Новый заказ ${numText}`,
    `Сумма: ${payload.total ?? ''} ₽`,
    `Дата/время: ${payload.date ?? ''} ${payload.time ?? ''}`,
    `Доставка: ${deliveryText}`,
    `Оплата: ${paymentText}`,
    `Бонусы списано: ${payload.bonuses_used ?? 0}`,
    `Промо: ${payload.promo_applied ? `да (скидка ${payload.promo_discount ?? 0}₽)` : 'нет'}`,
    ``,
    `Основные товары:`,
    regular,
    ``,
    `Дополнения:`,
    upsell,
    ``,
    `Админка: ${adminLink}`,
  ].join('\n');
}

async function vkSend(peerId: number, message: string) {
  const params = new URLSearchParams({
    access_token: VK_GROUP_TOKEN,
    v: VK_API_VERSION,
    peer_id: String(peerId),
    random_id: String(Math.floor(Math.random() * 2_000_000_000)),
    message,
  });

  const res = await fetch('https://api.vk.com/method/messages.send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(`VK HTTP ${res.status}`);
  if ((json as any).error) throw new Error(`VK API ${(json as any).error.error_code}: ${(json as any).error.error_msg}`);
  return (json as any).response;
}

export async function POST(req: Request) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    // 1) защита секретом
    if (WEBHOOK_SECRET) {
      const incoming = req.headers.get('x-order-webhook-secret') || '';
      if (incoming !== WEBHOOK_SECRET) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!VK_GROUP_TOKEN) return NextResponse.json({ ok: false, error: 'Missing VK_GROUP_TOKEN' }, { status: 500 });
    if (!VK_PEER_IDS) return NextResponse.json({ ok: false, error: 'Missing VK_PEER_IDS' }, { status: 500 });

    const peerIds = VK_PEER_IDS.split(',')
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0);

    if (!peerIds.length) return NextResponse.json({ ok: false, error: 'Invalid VK_PEER_IDS' }, { status: 500 });

    const payload = (await req.json()) as WebhookPayload;
    const text = buildText(payload);

    // 2) отправка всем получателям
    for (const peerId of peerIds) {
      try {
        await vkSend(peerId, text);
        console.log(`[VK][${requestId}] sent OK to peer_id=${peerId} order=${payload.order_number ?? 'n/a'}`);
      } catch (e: any) {
        console.error(`[VK][${requestId}] failed to peer_id=${peerId}:`, e?.message || e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`[VK][${requestId}] webhook error:`, e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Webhook error' }, { status: 500 });
  }
}
