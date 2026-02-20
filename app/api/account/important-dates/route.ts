import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { safeBody } from '@/lib/api/safeBody';
import { requireAuthPhone } from '@/lib/api/requireAuthPhone';

function toDateOrNull(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;

  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET() {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const { phone } = auth;

    const data = await prisma.important_dates.findMany({
      where: { phone },
      select: { type: true, date: true, description: true },
      orderBy: { date: 'asc' },
    });

    const normalized = (data || []).map((x) => ({
      ...x,
      date: x.date ? x.date.toISOString().slice(0, 10) : null,
    }));

    return NextResponse.json({ success: true, data: normalized }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }
    process.env.NODE_ENV !== 'production' && console.error('[important-dates GET]', e);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const { phone } = auth;

    const body = await safeBody<{
      events?: Array<{ type: string; date: string | null; description: string | null }>;
    }>(request, 'ACCOUNT IMPORTANT DATES API');
    if (body instanceof NextResponse) return body;

    const events = body?.events;

    const profile = await prisma.user_profiles.findUnique({
      where: { phone },
      select: { phone: true },
    });
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Профиль не найден' }, { status: 404 });
    }

    if (!Array.isArray(events)) {
      return NextResponse.json({ success: false, error: 'События должны быть массивом' }, { status: 400 });
    }

    await prisma.important_dates.deleteMany({ where: { phone } });

    const now = new Date();
    const sanitizedEvents = events.map((event) => {
      const type = sanitizeHtml(event?.type || '', { allowedTags: [], allowedAttributes: {} }) || 'Другое';
      const description =
        sanitizeHtml(event?.description || '', { allowedTags: [], allowedAttributes: {} }) || null;

      const date = toDateOrNull(event?.date);

      return {
        phone,
        type,
        date,
        description,
        created_at: now,
        updated_at: now,
      };
    });

    if (sanitizedEvents.length > 0) {
      await prisma.important_dates.createMany({ data: sanitizedEvents });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }
    process.env.NODE_ENV !== 'production' && console.error('[important-dates POST]', e);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
