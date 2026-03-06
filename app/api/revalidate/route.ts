import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { safeBody } from '@/lib/api/safeBody';
import { requireAdmin } from '@/lib/api/requireAdmin';

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

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
