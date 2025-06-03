import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { unlink } from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // Проверка сессии
    const baseUrl = new URL(req.url).origin;
    const sessionRes = await fetch(`${baseUrl}/api/admin-session`, {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData.success) {
      return NextResponse.json({ error: 'NEAUTH', message: 'Доступ запрещён' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Оптимизация изображения с помощью Sharp
    const optimizedImage = await sharp(buffer)
      .resize({ width: 1200, height: 800, fit: 'cover', withoutEnlargement: true }) // Уменьшаем размер
      .webp({ quality: 80 }) // Конвертируем в WebP
      .toBuffer();

    const filename = `${uuidv4()}.webp`;
    const filepath = join(process.cwd(), 'public/uploads/promo', filename);
    await sharp(optimizedImage).toFile(filepath);

    const image_url = `/uploads/promo/${filename}`;

    // Удаляем старое изображение, если оно есть
    if (oldImageUrl && oldImageUrl.startsWith('/uploads/promo/')) {
      const oldPath = join(process.cwd(), 'public', oldImageUrl);
      try {
        await unlink(oldPath);
      } catch (e) {
        console.warn(`Не удалось удалить старое изображение ${oldPath}:`, e);
      }
    }

    return NextResponse.json({ image_url });
  } catch (err: any) {
    console.error('Unexpected error in /api/promo/upload-image:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}