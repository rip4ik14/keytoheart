// ✅ Путь: app/api/account/profile/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { safeBody } from '@/lib/api/safeBody';
import { requireAuthPhone } from '@/lib/api/requireAuthPhone';

// Версия и текст согласия - фиксируем для доказательной базы
const CONSENT_VERSION = 'kth_marketing_v1_2026-02-20';
const CONSENT_TEXT =
  'Я согласен(на) получать новости и предложения (рекламные сообщения) от Ключ к сердцу по указанным контактам (телефон, мессенджеры, e-mail). Согласие можно отозвать в любой момент в личном кабинете.';

function clean(v: unknown, maxLen = 500): string {
  const s = sanitizeHtml(String(v ?? ''), { allowedTags: [], allowedAttributes: {} }).trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function GET() {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const profile = await prisma.user_profiles.findUnique({
      where: { phone: auth.phone },
      select: {
        name: true,
        last_name: true,
        email: true,
        birthday: true,
        receive_offers: true,
        receive_offers_at: true,
        receive_offers_source: true,
        receive_offers_version: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: profile || {
        name: null,
        last_name: null,
        email: null,
        birthday: null,
        receive_offers: false,
        receive_offers_at: null,
        receive_offers_source: null,
        receive_offers_version: null,
      },
    });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('[account/profile GET]', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const body = await safeBody<{
      // phone из клиента игнорируем - берём только из куки (auth.phone)
      phone?: string;

      name?: string;
      last_name?: string;
      email?: string;
      birthday?: string;

      receive_offers?: boolean;
      consent_source?: string; // откуда пользователь дал/отозвал согласие
    }>(request, 'ACCOUNT PROFILE API');
    if (body instanceof NextResponse) return body;

    const name = clean(body?.name, 50);
    const last_name = clean(body?.last_name, 50);
    const email = clean(body?.email, 120);
    const birthday = clean(body?.birthday, 32);

    const receive_offers =
      typeof body?.receive_offers === 'boolean' ? body.receive_offers : undefined;

    const consent_source = clean(body?.consent_source, 120) || 'account_profile';

    // Валидации
    if (!name) {
      return NextResponse.json({ success: false, error: 'Введите ваше имя' }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ success: false, error: 'Имя не должно превышать 50 символов' }, { status: 400 });
    }
    if (last_name.length > 50) {
      return NextResponse.json({ success: false, error: 'Фамилия не должна превышать 50 символов' }, { status: 400 });
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ success: false, error: 'Введите корректный email' }, { status: 400 });
    }

    const now = new Date();

    // Берём текущее состояние (для “ДР один раз” + для события согласия только при изменении)
    const existing = await prisma.user_profiles.findUnique({
      where: { phone: auth.phone },
      select: {
        birthday: true,
        receive_offers: true,
      },
    });

    const birthdayValue = existing?.birthday ?? (birthday ? birthday : null);

    const was = Boolean(existing?.receive_offers);
    const willChangeConsent = typeof receive_offers === 'boolean' && was !== receive_offers;

    await prisma.$transaction(async (tx) => {
      await tx.user_profiles.upsert({
        where: { phone: auth.phone },
        update: {
          name: name || null,
          last_name: last_name || null,
          email: email || null,
          birthday: birthdayValue,
          ...(typeof receive_offers === 'boolean'
            ? {
                receive_offers,
                receive_offers_at: now,
                receive_offers_source: consent_source,
                receive_offers_version: CONSENT_VERSION,
                receive_offers_ip: auth.ip,
                receive_offers_ua: auth.ua,
              }
            : {}),
          updated_at: now,
        },
        create: {
          phone: auth.phone,
          name: name || null,
          last_name: last_name || null,
          email: email || null,
          birthday: birthday ? birthday : null,

          receive_offers: typeof receive_offers === 'boolean' ? receive_offers : false,
          receive_offers_at: typeof receive_offers === 'boolean' ? now : null,
          receive_offers_source: typeof receive_offers === 'boolean' ? consent_source : null,
          receive_offers_version: typeof receive_offers === 'boolean' ? CONSENT_VERSION : null,
          receive_offers_ip: typeof receive_offers === 'boolean' ? auth.ip : null,
          receive_offers_ua: typeof receive_offers === 'boolean' ? auth.ua : null,

          created_at: now,
          updated_at: now,
        },
      });

      if (willChangeConsent) {
        await tx.marketing_consent_events.create({
          data: {
            phone: auth.phone,
            user_id: null,
            consent_type: 'marketing',
            granted: receive_offers!,
            source: consent_source,
            version: CONSENT_VERSION,
            text: CONSENT_TEXT,
            ip: auth.ip,
            user_agent: auth.ua,
            created_at: now,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('[account/profile POST]', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}