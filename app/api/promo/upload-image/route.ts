import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

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
      return NextResponse.json({ error: 'Файл обязателен' }, { status: 400 });
    }

    // Генерируем уникальное имя файла
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'promo');
    const uploadPath = join(uploadDir, fileName);

    // Читаем файл как ArrayBuffer
    const buffer = Buffer.from(await file.arrayBuffer());
    // Сохраняем файл
    await writeFile(uploadPath, buffer);

    const publicUrl = `/uploads/promo/${fileName}`;

    // Удаляем старое изображение, если указано
    if (oldImageUrl && oldImageUrl.startsWith('/uploads/promo/')) {
      const oldFilePath = join(process.cwd(), 'public', oldImageUrl);
      try { await unlink(oldFilePath); } catch {}

      // Если файл не найден — ничего страшного, пропускаем ошибку
    }

    return NextResponse.json({ image_url: publicUrl });
  } catch (err: any) {
    console.error('Unexpected error in /api/promo/upload-image:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
