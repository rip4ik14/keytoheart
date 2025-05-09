// ✅ Путь: app/api/promo/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Построение полного URL для /api/admin-session
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
    const oldImageUrl = formData.get('oldImageUrl') as string;

    if (!file) {
      return NextResponse.json({ error: 'Файл обязателен' }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;

    // Загрузка файла в существующий бакет promo-images
    const { error: uploadError } = await supabaseAdmin.storage
      .from('promo-images') // Используем правильное имя бакета
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from('promo-images') // Используем правильное имя бакета
      .getPublicUrl(fileName);

    if (!publicData?.publicUrl) {
      return NextResponse.json({ error: 'Не удалось получить публичный URL' }, { status: 500 });
    }

    // Удаляем старое изображение, если оно есть
    if (oldImageUrl) {
      const oldFileName = decodeURIComponent(oldImageUrl.split('/').pop()!);
      const { error: deleteError } = await supabaseAdmin.storage
        .from('promo-images') // Используем правильное имя бакета
        .remove([oldFileName]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        // Не возвращаем ошибку, так как новое изображение уже загружено
      }
    }

    return NextResponse.json({ image_url: publicData.publicUrl });
  } catch (err: any) {
    console.error('Unexpected error in /api/promo/upload-image:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}