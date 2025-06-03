// ✅ Путь: app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  // Проверка авторизации
  const baseUrl = new URL(req.url).origin;
  const sessionRes = await fetch(`${baseUrl}/api/admin-session`, {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || !sessionData.success) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const { path } = await req.json();
  if (!path) {
    return NextResponse.json({ error: 'Путь обязателен' }, { status: 400 });
  }

  revalidatePath(path);
  return NextResponse.json({ success: true, revalidated: path });
}