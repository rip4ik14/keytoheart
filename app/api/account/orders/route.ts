import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPhoneVariants } from '@/lib/normalizePhone';
import { requireAuthPhone } from '@/lib/api/requireAuthPhone';

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function pickProductImage(p: any): string | null {
  const firstFromImages =
    Array.isArray(p?.images) && p.images.length ? String(p.images[0]) : null;

  const cover = p?.cover_url ? String(p.cover_url) : null;

  return firstFromImages || cover || null;
}

export async function GET() {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const { phone } = auth;
    const variants = buildPhoneVariants(phone);

    const orders = await prisma.orders.findMany({
      where: { OR: variants.map((p) => ({ phone: p })) },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        total: true,
        bonuses_used: true,
        payment_method: true,
        status: true,
        recipient: true,
        items: true,
        upsell_details: true,
      },
    });

    // 1) собираем все product_id из items
    const productIds = new Set<number>();
    for (const o of orders || []) {
      const arr = Array.isArray((o as any).items) ? (o as any).items : [];
      for (const it of arr) {
        const pid = Number(it?.product_id ?? it?.id ?? 0);
        if (Number.isFinite(pid) && pid > 0) productIds.add(pid);
      }
    }

    // 2) вытаскиваем картинки из Supabase по id
    const idList = Array.from(productIds);
    const imageById = new Map<number, string>();

    if (idList.length) {
      const { data, error } = await supabase
        .from('products')
        .select('id, images, cover_url')
        .in('id', idList);

      if (!error && Array.isArray(data)) {
        for (const p of data) {
          const pid = Number((p as any).id);
          const img = pickProductImage(p);
          if (pid > 0 && img) imageById.set(pid, img);
        }
      }
    }

    // 3) нормализуем заказы и подставляем imageUrl (если в items нет)
    const normalized = (orders || []).map((order: any) => {
      const items = Array.isArray(order.items)
        ? order.items.map((item: any) => {
            const pid = Number(item.product_id ?? item.id ?? 0);
            const fromOrder = item.imageUrl ?? item.cover_url ?? item.coverUrl ?? null;
            const fromProduct = pid > 0 ? imageById.get(pid) ?? null : null;
            const img = fromOrder || fromProduct || null;

            return {
              product_id: pid,
              title: item.title || 'Неизвестный товар',
              quantity: item.quantity ?? 1,
              price: item.price ?? 0,

              // основные поля
              imageUrl: img,

              // совместимость со старым фронтом
              cover_url: img,
              coverUrl: img,
            };
          })
        : [];

      const upsellDetails = Array.isArray(order.upsell_details)
        ? order.upsell_details.map((u: any) => ({
            title: u.title || 'Неизвестный товар',
            price: u.price || 0,
            quantity: u.quantity || 1,
            category: u.category || 'unknown',
          }))
        : [];

      return {
        id: String(order.id),
        created_at: order.created_at ? new Date(order.created_at).toISOString() : '',
        total: Number(order.total ?? 0),
        bonuses_used: Number(order.bonuses_used ?? 0),
        payment_method: order.payment_method ?? 'cash',
        status: order.status ?? '',
        recipient: order.recipient || 'Не указан',
        items,
        upsell_details: upsellDetails,
      };
    });

    return NextResponse.json(
      { success: true, data: normalized },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }
    process.env.NODE_ENV !== 'production' && console.error('[account/orders]', e);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}