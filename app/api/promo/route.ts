import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';

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
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Prisma promo_blocks GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
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
    const data = await prisma.promo_blocks.create({
      data: {
        title,
        subtitle,
        button_text,
        href,
        image_url,
        type,
        order_index,
      },
    });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Prisma promo_blocks POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Обновить промо-блок
export async function PATCH(req: NextRequest) {
  try {
    const updateBody = await safeBody<{
      id?: number | string;
      title?: string;
      subtitle?: string;
      button_text?: string;
      href?: string;
      image_url?: string;
      type?: string;
      order_index?: number;
    }>(req, 'PROMO API');
    if (updateBody instanceof NextResponse) {
      return updateBody;
    }
    const { id, title, subtitle, button_text, href, image_url, type, order_index } = updateBody;
    const data = await prisma.promo_blocks.update({
      where: { id: Number(id) },
      data: {
        title,
        subtitle,
        button_text,
        href,
        image_url,
        type,
        order_index,
      },
    });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Prisma promo_blocks PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Удалить промо-блок
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.promo_blocks.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Prisma promo_blocks DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
