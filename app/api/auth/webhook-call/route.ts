// app/api/auth/webhook-call/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    process.env.NODE_ENV !== "production" && console.log(`[${new Date().toISOString()}] Webhook received`);
    // 1. Считываем form-data
    const formData = await request.formData();
    const entries = Object.fromEntries(formData.entries());

    // 2. Извлекаем все поля data[]
    const dataValues = Object.keys(entries)
      .filter((key) => key.startsWith('data['))
      .map((key) => entries[key] as string);

    for (const entry of dataValues) {
      const lines = entry.split('\n');
      if (lines[0] !== 'callcheck_status') continue;

      const checkId = lines[1];
      const statusCode = lines[2];
      process.env.NODE_ENV !== "production" && console.log(
        `[${new Date().toISOString()}] Processing webhook: checkId=${checkId}, status=${statusCode}`
      );

      if (!checkId || !statusCode) continue;

      // 3. Находим запись в auth_logs по check_id
      const log = await prisma.auth_logs.findUnique({
        where: { check_id: checkId },
      });
      if (!log) {
        process.env.NODE_ENV !== "production" && console.error(
          `[${new Date().toISOString()}] auth_logs record not found for check_id=${checkId}`
        );
        continue;
      }

      // 4. Вычисляем новый статус
      const newStatus =
        statusCode === '401'
          ? 'VERIFIED'
          : statusCode === '402'
          ? 'EXPIRED'
          : 'PENDING';

      // 5. Обновляем запись
      await prisma.auth_logs.update({
        where: { check_id: checkId },
        data: {
          status: newStatus,
          updated_at: new Date(),
        },
      });

      process.env.NODE_ENV !== "production" && console.log(
        `[${new Date().toISOString()}] auth_logs updated: check_id=${checkId}, status=${newStatus}`
      );

      // 6. Если пользователь прошёл верификацию, создаём профиль
      if (newStatus === 'VERIFIED') {
        const phone = log.phone;
        const existing = await prisma.user_profiles.findUnique({
          where: { phone },
        });
        if (!existing) {
          await prisma.user_profiles.create({
            data: {
              phone,
              updated_at: new Date(),
            },
          });
          process.env.NODE_ENV !== "production" && console.log(
            `[${new Date().toISOString()}] Created user_profiles for phone=${phone}`
          );
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error(
      `[${new Date().toISOString()}] Error in webhook-call:`,
      error
    );
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
