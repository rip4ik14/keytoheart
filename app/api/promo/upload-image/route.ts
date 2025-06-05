import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Проверка сессии (вместо fetch — с BASE_URL из .env, если нужен)
    const baseUrl = process.env.BASE_URL || 'https://keytoheart.ru';
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

    // Оптимизация изображения
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimizedImage = await sharp(buffer)
      .resize({ width: 1200, height: 800, fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Генерируем уникальное имя
    const filename = `${uuidv4()}.webp`;

    // ИНИЦИАЛИЗИРУЕМ КЛИЕНТ SUPABASE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are missing in .env');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Загружаем в Supabase Storage
    const { error } = await supabase.storage
      .from('product-image')
      .upload(filename, optimizedImage, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки в Supabase Storage:', error);
      return NextResponse.json({ error: 'Ошибка загрузки файла в Supabase' }, { status: 500 });
    }

    // Формируем публичный URL
    const image_url = `${supabaseUrl}/storage/v1/object/public/product-image/${filename}`;

    // Удаляем старое изображение если оно на Supabase
    if (oldImageUrl && oldImageUrl.includes('product-image/')) {
      const parts = oldImageUrl.split('product-image/');
      const oldFile = parts[1];
      if (oldFile) {
        await supabase.storage.from('product-image').remove([oldFile]);
      }
    }

    return NextResponse.json({ image_url });
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Unexpected error in /api/promo/upload-image:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
