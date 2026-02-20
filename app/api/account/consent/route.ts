import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';
import { normalizePhone } from '@/lib/normalizePhone';
import sanitizeHtml from 'sanitize-html';
import { cookies, headers } from 'next/headers';

function cleanText(v: unknown) {
  return sanitizeHtml(String(v ?? ''), { allowedTags: [], allowedAttributes: {} }).trim();
}

function getIpFromHeaders(h: Headers): string | null {
  const xf = h.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || null;
  const xr = h.get('x-real-ip');
  return xr?.trim() || null;
}

export async function POST(request: Request) {
  try {
    const body = await safeBody<{
      granted?: boolean;
      source?: string;
      version?: string;
      text?: string;
    }>(request, 'ACCOUNT CONSENT API');
    if (body instanceof NextResponse) return body;

    const granted = Boolean(body?.granted);

    const source = cleanText(body?.source) || 'account';
    const version = cleanText(body?.version) || 'unknown';
    const text = cleanText(body?.text) || '';

    // берем телефон только из куки, чтобы никто не мог обновить чужой номер
    const cookieStore = await cookies();
    const rawPhone = cookieStore.get('user_phone')?.value ?? '';
    const phone = normalizePhone(rawPhone);

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json({ success: false, error: 'Нет активной сессии' }, { status: 401 });
    }

    const h = await headers();
    const ip = getIpFromHeaders(h);
    const ua = h.get('user-agent')?.slice(0, 400) || null;

    const now = new Date();

    // гарантируем профиль (если вдруг его нет)
    await prisma.user_profiles.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        created_at: now,
        updated_at: now,
        receive_offers: false,
      },
    });

    // обновляем “текущее состояние” согласия
    await prisma.user_profiles.update({
      where: { phone },
      data: {
        receive_offers: granted,
        receive_offers_at: now,
        receive_offers_source: source,
        receive_offers_version: version,
        receive_offers_ip: ip,
        receive_offers_ua: ua,
        updated_at: now,
      },
    });

    // пишем событие в историю (юридический след)
    await prisma.marketing_consent_events.create({
      data: {
        phone,
        consent_type: 'marketing',
        granted,
        source,
        version,
        text: text || (granted ? 'consent_granted' : 'consent_revoked'),
        ip: ip,
        user_agent: ua,
        created_at: now,
      } as any,
    });

    return NextResponse.json({ success: true, granted, phone });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('[account/consent POST]', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}