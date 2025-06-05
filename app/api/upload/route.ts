import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

// Поддержка: WebP, JPEG, PNG
const SUPPORTED_MIME = ['image/webp', 'image/jpeg', 'image/png'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }
    if (!SUPPORTED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Неподдерживаемый тип файла' }, { status: 415 });
    }

    // Читаем файл
    const buffer = Buffer.from(await file.arrayBuffer());

    // Оптимизация: ресайз и перекодировка в webp
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 1200,
        height: 800,
        fit: 'cover',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Генерируем имя файла
    const filename = `${uuidv4()}.webp`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const savePath = join(uploadsDir, filename);

    // Создаем директорию, если нет
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Сохраняем файл
    await writeFile(savePath, optimizedBuffer);

    // Удаляем старое изображение, если есть
    if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
      const oldPath = join(process.cwd(), 'public', oldImageUrl);
      try {
        await unlink(oldPath);
      } catch (e) {
        // ничего, если файла нет
      }
    }

    // URL для клиента (начинается с /uploads/...)
    const image_url = `/uploads/${filename}`;

    return NextResponse.json({ image_url });
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки изображения:', err);
    return NextResponse.json({ error: 'Ошибка сервера: ' + err.message }, { status: 500 });
  }
}
