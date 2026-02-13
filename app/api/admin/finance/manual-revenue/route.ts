// ✅ Путь: app/api/admin/finance/manual-revenue/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonNoStore(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.headers.set('CDN-Cache-Control', 'no-store');
  res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  return res;
}

function toISODate(v: any): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toISODateTime(v: any): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function toIntRub(v: any): number {
  const n = Number(String(v ?? '').replace(',', '.').trim());
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      select id, date, source, amount, comment, created_at, updated_at
      from public.finance_manual_revenue
      order by date desc, created_at desc
      limit 500
    `;

    const normalized = (rows || []).map((r) => ({
      id: String(r.id),
      date: toISODate(r.date),
      source: String(r.source),
      amount: Number(r.amount) || 0, // integer
      comment: r.comment ? String(r.comment) : null,
      created_at: toISODateTime(r.created_at),
      updated_at: r.updated_at ? toISODateTime(r.updated_at) : null,
    }));

    return jsonNoStore(normalized, 200);
  } catch {
    return jsonNoStore({ error: 'Ошибка получения ручной выручки' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const date = String(body?.date || '');
    const source = String(body?.source || '').trim();
    const amount = toIntRub(body?.amount);
    const comment = body?.comment ? String(body.comment) : null;

    if (!date || !source || amount <= 0) {
      return jsonNoStore({ error: 'Некорректные данные' }, 400);
    }

    const inserted = await prisma.$queryRaw<any[]>`
      insert into public.finance_manual_revenue (date, source, amount, comment)
      values (${date}::date, ${source}::text, ${amount}::int, ${comment})
      returning id, date, source, amount, comment, created_at, updated_at
    `;

    const r = inserted?.[0];
    if (!r) return jsonNoStore({ error: 'Ошибка добавления' }, 500);

    return jsonNoStore(
      {
        id: String(r.id),
        date: toISODate(r.date),
        source: String(r.source),
        amount: Number(r.amount) || 0,
        comment: r.comment ? String(r.comment) : null,
        created_at: toISODateTime(r.created_at),
        updated_at: r.updated_at ? toISODateTime(r.updated_at) : null,
      },
      200
    );
  } catch {
    return jsonNoStore({ error: 'Ошибка добавления ручной выручки' }, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const id = String(body?.id || '');
    const date = String(body?.date || '');
    const source = String(body?.source || '').trim();
    const amount = toIntRub(body?.amount);
    const comment = body?.comment ? String(body.comment) : null;

    if (!id || !date || !source || amount <= 0) {
      return jsonNoStore({ error: 'Некорректные данные' }, 400);
    }

    const updated = await prisma.$queryRaw<any[]>`
      update public.finance_manual_revenue
      set date = ${date}::date,
          source = ${source}::text,
          amount = ${amount}::int,
          comment = ${comment},
          updated_at = now()
      where id = ${id}::uuid
      returning id, date, source, amount, comment, created_at, updated_at
    `;

    const r = updated?.[0];
    if (!r) return jsonNoStore({ error: 'Не найдено' }, 404);

    return jsonNoStore(
      {
        id: String(r.id),
        date: toISODate(r.date),
        source: String(r.source),
        amount: Number(r.amount) || 0,
        comment: r.comment ? String(r.comment) : null,
        created_at: toISODateTime(r.created_at),
        updated_at: r.updated_at ? toISODateTime(r.updated_at) : null,
      },
      200
    );
  } catch {
    return jsonNoStore({ error: 'Ошибка обновления ручной выручки' }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = String(body?.id || '');
    if (!id) return jsonNoStore({ error: 'Некорректные данные' }, 400);

    await prisma.$executeRaw`
      delete from public.finance_manual_revenue
      where id = ${id}::uuid
    `;

    return jsonNoStore({ ok: true }, 200);
  } catch {
    return jsonNoStore({ error: 'Ошибка удаления' }, 500);
  }
}
