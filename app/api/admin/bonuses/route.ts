import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';
import { safeBody } from '@/lib/api/safeBody';
import { normalizePhone } from '@/lib/normalizePhone';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No session token provided' }, { status: 401 });
    }

    const isValidToken = await verifyAdminJwt(token);
    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const body = await safeBody<{
      phone?: string;
      delta?: number;
      reason?: string;
    }>(req, 'ADMIN BONUSES API');
    if (body instanceof NextResponse) return body;

    const rawPhone = (body.phone || '').trim();
    const phone = normalizePhone(rawPhone);

    const delta = Number(body.delta);
    const reason = (body.reason || '').trim();

    if (!phone || !Number.isFinite(delta) || delta === 0 || !reason) {
      return NextResponse.json({ error: 'Missing/invalid required fields' }, { status: 400 });
    }

    if (!/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.bonuses.findUnique({
        where: { phone },
        select: { id: true, bonus_balance: true },
      });

      const currentBal = current?.bonus_balance ?? 0;
      const newBal = currentBal + delta;

      if (newBal < 0) {
        return { ok: false as const, code: 400, payload: { error: 'Balance cannot be negative' } };
      }

      const upserted = await tx.bonuses.upsert({
        where: { phone },
        update: {
          bonus_balance: newBal,
          updated_at: new Date(),
          ...(delta > 0 ? { total_bonus: { increment: delta } } : {}),
        },
        create: {
          phone,
          bonus_balance: newBal,
          level: 'Бронзовый',
          updated_at: new Date(),
          total_spent: 0,
          total_bonus: Math.max(0, delta),
        },
        select: { id: true },
      });

      // История: пишем по телефону + bonus_id, user_id НЕ трогаем (FK на auth.users)
      await tx.bonus_history.create({
        data: {
          bonus_id: upserted.id,
          phone,
          amount: delta,
          reason,
          created_at: new Date(),
        },
      });

      return { ok: true as const, newBalance: newBal };
    });

    if (!result.ok) {
      return NextResponse.json(result.payload, { status: result.code });
    }

    return NextResponse.json({ success: true, newBalance: result.newBalance });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error updating bonuses:', error);
    return NextResponse.json({ error: 'Failed to update bonuses: ' + error.message }, { status: 500 });
  }
}
