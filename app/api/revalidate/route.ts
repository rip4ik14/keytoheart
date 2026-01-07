import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { safeBody } from '@/lib/api/safeBody';

export async function POST(req: NextRequest) {
  // Не забудь поправить абсолютный url!
  const baseUrl = new URL(req.url).origin;
  const sessionRes = await fetch(`${baseUrl}/api/admin-session`, {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || !sessionData.success) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const body = await safeBody<{ tag?: string }>(req, 'REVALIDATE API');
  if (body instanceof NextResponse) {
    return body;
  }
  const { tag } = body;
  if (!tag) {
    return NextResponse.json({ error: 'Тег обязателен' }, { status: 400 });
  }

  revalidateTag(tag);
  return NextResponse.json({ success: true, revalidated: tag });
}
