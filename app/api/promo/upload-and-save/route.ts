// app/api/promo/upload-and-save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

function checkCSRF(req: NextRequest) {
  const csrfToken = req.headers.get('X-CSRF-Token');
  const stored = req.cookies.get('csrf_token')?.value;
  return csrfToken && stored && csrfToken === stored;
}

export async function POST(req: NextRequest) {
  try {
    // Проверка сессии
    const baseUrl = process.env.BASE_URL || 'https://keytoheart.ru';
    const sessionRes = await fetch(`${baseUrl}/api/admin-session`, {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData.success) {
      return NextResponse.json({ error: 'NEAUTH', message: 'Доступ запрещён' }, { status: 401 });
    }

    if (!checkCSRF(req)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const oldImageUrl = formData.get('oldImageUrl') as string | null;
    const title = formData.get('title') as string | null;
    const subtitle = formData.get('subtitle') as string | null;
    const button_text = formData.get('button_text') as string | null;
    const href = formData.get('href') as string | null;
    const type = formData.get('type') as 'card' | 'banner' | null;
    const order_index = formData.get('order_index') as string | null;
    const id = formData.get('id') as string | null;

    // Валидация обязательных полей
    if (!file || !title || !href || !type) {
      return NextResponse.json({ error: 'Обязательные поля (file, title, href, type) не предоставлены' }, { status: 400 });
    }

    // Оптимизация изображения
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimizedImage = await sharp(buffer)
      .resize({ width: 1200, height: 800, fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Генерируем уникальное имя
    const filename = `${uuidv4()}.webp`;

    // Инициализация Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are missing in .env');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Загружаем в Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('promo-images')
      .upload(filename, optimizedImage, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      process.env.NODE_ENV !== 'production' && console.error('Ошибка загрузки в Supabase Storage:', uploadError);
      return NextResponse.json({ error: 'Ошибка загрузки файла в Supabase' }, { status: 500 });
    }

    // Формируем публичный URL
    const image_url = `${supabaseUrl}/storage/v1/object/public/promo-images/${filename}`;

    // Удаляем старое изображение, если оно есть
    if (oldImageUrl && oldImageUrl.includes('promo-images/')) {
      const parts = oldImageUrl.split('promo-images/');
      const oldFile = parts[1];
      if (oldFile) {
        await supabase.storage.from('promo-images').remove([oldFile]);
      }
    }

    // Сохранение или обновление в Prisma
    const payload = {
      title,
      subtitle: subtitle || null,
      button_text: button_text || null,
      href,
      image_url,
      type,
      order_index: order_index ? parseInt(order_index, 10) : 0,
    };

    let promoBlock;
    if (id) {
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return NextResponse.json({ error: 'Неверный ID блока' }, { status: 400 });
      }
      promoBlock = await prisma.promo_blocks.update({
        where: { id: idNum },
        data: payload,
      });
    } else {
      promoBlock = await prisma.promo_blocks.create({
        data: payload,
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...promoBlock, image_url },
      message: id ? 'Блок обновлён' : 'Блок добавлен',
    });
  } catch (err: any) {
    process.env.NODE_ENV !== 'production' && console.error('Unexpected error in /api/promo/upload-and-save:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
  }
}