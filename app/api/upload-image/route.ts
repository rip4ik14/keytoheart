// ✅ Путь: app/api/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const alt = formData.get('alt') as string;
    const section = formData.get('section') as string;

    if (!file || !section) {
      return NextResponse.json({ error: 'Файл и секция обязательны' }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from('corporate-images')
      .upload(fileName, file);

    if (storageError) {
      console.error('Ошибка загрузки файла:', storageError);
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    const url = supabaseAdmin.storage.from('corporate-images').getPublicUrl(fileName).data.publicUrl;

    const { error: dbError } = await supabaseAdmin
      .from('images')
      .insert({ url, alt, section });

    if (dbError) {
      console.error('Ошибка сохранения метаданных:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}