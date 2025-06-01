import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Получить все промо-блоки
export async function GET() {
  try {
    const blocks = await prisma.promo_blocks.findMany({
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
      orderBy: { order_index: 'asc' },
    });
    return NextResponse.json(blocks);
  } catch (err: any) {
    console.error('Unexpected error in /api/promo GET:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Создать промо-блок
export async function POST(req: NextRequest) {
  try {
    const { title, subtitle, button_text, href, image_url, type, order_index } = await req.json();
    const block = await prisma.promo_blocks.create({
      data: { title, subtitle, button_text, href, image_url, type, order_index },
    });
    return NextResponse.json(block);
  } catch (err: any) {
    console.error('Unexpected error in /api/promo POST:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Обновить промо-блок
export async function PATCH(req: NextRequest) {
  try {
    const { id, title, subtitle, button_text, href, image_url, type, order_index } = await req.json();
    const block = await prisma.promo_blocks.update({
      where: { id },
      data: { title, subtitle, button_text, href, image_url, type, order_index },
    });
    return NextResponse.json(block);
  } catch (err: any) {
    console.error('Unexpected error in /api/promo PATCH:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Удалить промо-блок + картинку на сервере
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(req: NextRequest) {
  try {
    const { id, image_url } = await req.json();

    // Удаляем локальный файл картинки, если она из папки uploads/promo
    if (image_url && image_url.startsWith('/uploads/promo/')) {
      const localPath = join(process.cwd(), 'public', image_url);
      try { await unlink(localPath); } catch (e) { /* файл мог быть уже удалён */ }
    }

    await prisma.promo_blocks.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected error in /api/promo DELETE:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}