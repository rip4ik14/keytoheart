// ✅ Путь: app/api/promo/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'promo-blocks';

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
      .resize({ width: 1200, height: 800, fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Имя файла — uuid.webp
    const filename = `${uuidv4()}.webp`;

    // Загрузка в Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, optimizedImage, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp',
      });

    if (error) {
      console.error('Ошибка загрузки в Supabase Storage:', error);
      return NextResponse.json({ error: 'Ошибка загрузки в Storage' }, { status: 500 });
    }

    // Удаляем старую картинку, если есть (по ссылке из Storage)
    if (oldImageUrl && oldImageUrl.includes(`/${BUCKET}/`)) {
      // Обрезаем полный URL до пути внутри бакета
      const parts = oldImageUrl.split(`/${BUCKET}/`);
      if (parts[1]) {
        await supabase.storage.from(BUCKET).remove([parts[1]]);
      }
    }

    // Генерируем публичный URL
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${BUCKET}/${filename}`;

    return NextResponse.json({ image_url: publicUrl });
  } catch (err: any) {
    console.error('Unexpected error in /api/promo/upload-image:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
