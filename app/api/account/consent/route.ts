// ✅ Путь: app/api/account/consent/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';
import { requireAuthPhone } from '@/lib/api/requireAuthPhone';
import sanitizeHtml from 'sanitize-html';

// серверная версия и текст - для доказательной базы, пользователю не показываем
const CONSENT_VERSION = 'kth_marketing_v1_2026-02-20';
const CONSENT_TEXT =
  'Я согласен(на) получать новости и предложения (рекламные сообщения) от Ключ к сердцу по указанным контактам (телефон, мессенджеры, e-mail). Согласие можно отозвать в любой момент в личном кабинете.';

function cleanText(v: unknown, maxLen = 200): string {
  const s = sanitizeHtml(String(v ?? ''), { allowedTags: [], allowedAttributes: {} }).trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const body = await safeBody<{
      granted?: boolean;
      source?: string;
    }>(request, 'ACCOUNT CONSENT API');
    if (body instanceof NextResponse) return body;

    const granted = Boolean(body?.granted);
    const source = cleanText(body?.source, 120) || 'account';
    const now = new Date();

    // гарантируем профиль (если вдруг его нет)
    await prisma.user_profiles.upsert({
      where: { phone: auth.phone },
      update: { updated_at: now },
      create: {
        phone: auth.phone,
        created_at: now,
        updated_at: now,
        receive_offers: false,
      },
    });

    // обновляем “текущее состояние” согласия
    await prisma.user_profiles.update({
      where: { phone: auth.phone },
      data: {
        receive_offers: granted,
        receive_offers_at: now,
        receive_offers_source: source,
        receive_offers_version: CONSENT_VERSION,
        receive_offers_ip: auth.ip,
        receive_offers_ua: auth.ua?.slice(0, 400) || null,
        updated_at: now,
      },
    });

    // юридический след - best effort
    try {
      await prisma.marketing_consent_events.create({
        data: {
          phone: auth.phone,
          user_id: null,
          consent_type: 'marketing',
          granted,
          source,
          version: CONSENT_VERSION,
          text: CONSENT_TEXT,
          ip: auth.ip,
          user_agent: auth.ua?.slice(0, 400) || null,
          created_at: now,
        },
      });
    } catch (e) {
      // не ломаем UX. но в dev увидишь причину.
      process.env.NODE_ENV !== 'production' &&
        console.error('[account/consent] failed to write marketing_consent_events', e);
    }

    return NextResponse.json({ success: true, granted });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('[account/consent POST]', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}