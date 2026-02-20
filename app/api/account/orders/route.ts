import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPhoneVariants } from '@/lib/normalizePhone';
import { requireAuthPhone } from '@/lib/api/requireAuthPhone';

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

    const normalized = (orders || []).map((order: any) => {
      const items = Array.isArray(order.items)
        ? order.items.map((item: any) => {
            const img = item.imageUrl ?? item.cover_url ?? item.coverUrl ?? null;

            return {
              product_id: item.product_id ?? item.id ?? 0,
              title: item.title || 'Неизвестный товар',
              quantity: item.quantity ?? 1,
              price: item.price ?? 0,

              // главное поле для нового фронта
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