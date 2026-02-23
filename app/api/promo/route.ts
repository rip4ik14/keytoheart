// ✅ Путь: app/api/promo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';

type PromoType = 'banner' | 'card';

function isPromoType(value: unknown): value is PromoType {
  return value === 'banner' || value === 'card';
}

function toSafeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Получить все промо-блоки
export async function GET() {
  try {
    const data = await prisma.promo_blocks.findMany({
      orderBy: { order_index: 'asc' },
      select: {
        id: true,
        title: true,
        subtitle: true,
        button_text: true,
        href: true,
        image_url: true,
        type: true,
        order_index: true,
      },
    });

    return NextResponse.json(data, {
      headers: {
        // Небольшой CDN/browser cache, безопасно для промо
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err: any) {
    console.error('Prisma promo_blocks GET error:', err);
    return NextResponse.json({ error: err.message || 'GET promo error' }, { status: 500 });
  }
}

// Создать промо-блок
export async function POST(req: NextRequest) {
  try {
    const createBody = await safeBody<{
      title?: string;
      subtitle?: string;
      button_text?: string;
      href?: string;
      image_url?: string;
      type?: string;
      order_index?: number;
    }>(req, 'PROMO API');

    if (createBody instanceof NextResponse) {
      return createBody;
    }

    const { title, subtitle, button_text, href, image_url, type, order_index } = createBody;

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (typeof href !== 'string' || !href.trim()) {
      return NextResponse.json({ error: 'href is required' }, { status: 400 });
    }
    if (typeof image_url !== 'string' || !image_url.trim()) {
      return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
    }
    if (!isPromoType(type)) {
      return NextResponse.json({ error: 'type must be "banner" or "card"' }, { status: 400 });
    }

    const data = await prisma.promo_blocks.create({
      data: {
        title: title.trim(),
        subtitle: typeof subtitle === 'string' ? subtitle : null,
        button_text: typeof button_text === 'string' ? button_text : null,
        href: href.trim(),
        image_url: image_url.trim(),
        type,
        order_index: typeof order_index === 'number' ? order_index : null,
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        button_text: true,
        href: true,
        image_url: true,
        type: true,
        order_index: true,
      },
    });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error('Prisma promo_blocks POST error:', err);
    return NextResponse.json({ error: err.message || 'POST promo error' }, { status: 500 });
  }
}

// Обновить промо-блок
export async function PATCH(req: NextRequest) {
  try {
    const updateBody = await safeBody<{
      id?: number | string;
      title?: string;
      subtitle?: string | null;
      button_text?: string | null;
      href?: string;
      image_url?: string;
      type?: string;
      order_index?: number | null;
    }>(req, 'PROMO API');

    if (updateBody instanceof NextResponse) {
      return updateBody;
    }

    const { id, title, subtitle, button_text, href, image_url, type, order_index } = updateBody;

    const promoId = toSafeNumber(id);
    if (!promoId) {
      return NextResponse.json({ error: 'Valid id is required' }, { status: 400 });
    }

    if (type !== undefined && !isPromoType(type)) {
      return NextResponse.json({ error: 'type must be "banner" or "card"' }, { status: 400 });
    }

    const data = await prisma.promo_blocks.update({
      where: { id: promoId },
      data: {
        title: typeof title === 'string' ? title.trim() : undefined,
        subtitle: subtitle === null ? null : typeof subtitle === 'string' ? subtitle : undefined,
        button_text:
          button_text === null
            ? null
            : typeof button_text === 'string'
              ? button_text
              : undefined,
        href: typeof href === 'string' ? href.trim() : undefined,
        image_url: typeof image_url === 'string' ? image_url.trim() : undefined,
        type: type as PromoType | undefined,
        order_index:
          order_index === null
            ? null
            : typeof order_index === 'number'
              ? order_index
              : undefined,
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        button_text: true,
        href: true,
        image_url: true,
        type: true,
        order_index: true,
      },
    });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error('Prisma promo_blocks PATCH error:', err);
    return NextResponse.json({ error: err.message || 'PATCH promo error' }, { status: 500 });
  }
}

// Удалить промо-блок
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const promoId = toSafeNumber(body?.id);

    if (!promoId) {
      return NextResponse.json({ error: 'Valid id is required' }, { status: 400 });
    }

    await prisma.promo_blocks.delete({ where: { id: promoId } });

    return NextResponse.json(
      { success: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err: any) {
    console.error('Prisma promo_blocks DELETE error:', err);
    return NextResponse.json({ error: err.message || 'DELETE promo error' }, { status: 500 });
  }
}