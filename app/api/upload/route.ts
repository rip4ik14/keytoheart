import { NextRequest, NextResponse } from 'next/server';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Файл не получен' }, { status: 400 });
    }

    // Создаём папку, если нет
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    mkdirSync(uploadsDir, { recursive: true });

    // Уникальное имя
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = join(uploadsDir, filename);

    // Сохраняем файл
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    // URL для public
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Ошибка загрузки: ' + err.message }, { status: 500 });
  }
}
