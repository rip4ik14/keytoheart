// ✅ Путь: app/api/auth/webhook-call/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone } from '@/lib/normalizePhone';

type LogStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED';

function mapStatusCode(statusCode: string): LogStatus {
  if (statusCode === '401') return 'VERIFIED';
  if (statusCode === '402') return 'EXPIRED';
  return 'PENDING';
}

function safeText(v: unknown): string {
  return sanitizeHtml(String(v ?? ''), { allowedTags: [], allowedAttributes: {} }).trim();
}

export async function POST(request: Request) {
  try {
    process.env.NODE_ENV !== 'production' &&
      console.log(`[${new Date().toISOString()}] Webhook received`);

    // 1) form-data
    const formData = await request.formData();
    const entries = Object.fromEntries(formData.entries());

    // 2) Достаём все data[...]
    const dataValues = Object.keys(entries)
      .filter((key) => key.startsWith('data['))
      .map((key) => safeText(entries[key] as any))
      .filter(Boolean);

    let processed = 0;

    for (const entry of dataValues) {
      const lines = entry.split('\n').map((l) => safeText(l));

      // Формат от SMS.ru: callcheck_status \n check_id \n statusCode ...
      if (lines[0] !== 'callcheck_status') continue;

      const checkId = lines[1];
      const statusCode = lines[2];

      if (!checkId || !statusCode) continue;

      const newStatus = mapStatusCode(statusCode);

      process.env.NODE_ENV !== 'production' &&
        console.log(
          `[${new Date().toISOString()}] Processing webhook: checkId=${checkId}, status=${statusCode} -> ${newStatus}`
        );

      // 3) Находим лог
      const log = await prisma.auth_logs.findUnique({
        where: { check_id: checkId },
        select: { check_id: true, phone: true, status: true },
      });

      if (!log) {
        process.env.NODE_ENV !== 'production' &&
          console.error(
            `[${new Date().toISOString()}] auth_logs not found for check_id=${checkId}`
          );
        continue;
      }

      const normalizedPhone = normalizePhone(log.phone);

      // Если в логе телефон мусорный - профиль не создаём, но статус обновим
      const isPhoneValid = /^\+7\d{10}$/.test(normalizedPhone);

      // 4) Обновляем статус (и заодно фиксируем phone в каноническом виде, если валиден)
      await prisma.auth_logs.update({
        where: { check_id: checkId },
        data: {
          status: newStatus,
          updated_at: new Date(),
          ...(isPhoneValid ? { phone: normalizedPhone } : {}),
        },
      });

      // 5) Если VERIFIED - создаём профиль (upsert, чтобы не ловить гонки)
      if (newStatus === 'VERIFIED' && isPhoneValid) {
        await prisma.user_profiles.upsert({
          where: { phone: normalizedPhone },
          update: {
            updated_at: new Date(),
          },
          create: {
            phone: normalizedPhone,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        process.env.NODE_ENV !== 'production' &&
          console.log(
            `[${new Date().toISOString()}] user_profiles upserted for phone=${normalizedPhone}`
          );
      }

      processed += 1;
    }

    return NextResponse.json({ success: true, message: 'Webhook processed', processed });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error(`[${new Date().toISOString()}] Error in webhook-call:`, error);

    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
