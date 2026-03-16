// ✅ Путь: app/api/admin/finance/expenses/route.ts
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

function toTextOrNull(v: any): string | null {
  const s = String(v ?? '').trim();
  return s ? s : null;
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      select id, date, category, amount, supplier, comment, created_at, updated_at
      from public.finance_expenses
      order by date desc, created_at desc
      limit 500
    `;

    const normalized = (rows || []).map((r) => ({
      id: String(r.id),
      date: toISODate(r.date),
      category: String(r.category),
      amount: Number(r.amount) || 0,
      supplier: r.supplier ? String(r.supplier) : null,
      comment: r.comment ? String(r.comment) : null,
      created_at: toISODateTime(r.created_at),
      updated_at: r.updated_at ? toISODateTime(r.updated_at) : null,
    }));

    return jsonNoStore(normalized, 200);
  } catch {
    return jsonNoStore({ error: 'Ошибка получения расходов' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const date = String(body?.date || '');
    const category = String(body?.category || '').trim();
    const amount = toIntRub(body?.amount);

    const supplier = toTextOrNull(body?.supplier);
    const comment = toTextOrNull(body?.comment);

    if (!date || !category || amount <= 0) {
      return jsonNoStore({ error: 'Некорректные данные' }, 400);
    }

    const inserted = await prisma.$queryRaw<any[]>`
      insert into public.finance_expenses (date, category, amount, supplier, comment)
      values (${date}::date, ${category}::text, ${amount}::int, ${supplier}, ${comment})
      returning id, date, category, amount, supplier, comment, created_at, updated_at
    `;

    const r = inserted?.[0];
    if (!r) return jsonNoStore({ error: 'Ошибка добавления' }, 500);

    return jsonNoStore(
      {
        id: String(r.id),
        date: toISODate(r.date),
        category: String(r.category),
        amount: Number(r.amount) || 0,
        supplier: r.supplier ? String(r.supplier) : null,
        comment: r.comment ? String(r.comment) : null,
        created_at: toISODateTime(r.created_at),
        updated_at: r.updated_at ? toISODateTime(r.updated_at) : null,
      },
      200
    );
  } catch {
    return jsonNoStore({ error: 'Ошибка добавления расхода' }, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const id = String(body?.id || '');
    const date = String(body?.date || '');
    const category = String(body?.category || '').trim();
    const amount = toIntRub(body?.amount);

    const supplier = toTextOrNull(body?.supplier);
    const comment = toTextOrNull(body?.comment);

    if (!id || !date || !category || amount <= 0) {
      return jsonNoStore({ error: 'Некорректные данные' }, 400);
    }

    const updated = await prisma.$queryRaw<any[]>`
      update public.finance_expenses
      set date = ${date}::date,
          category = ${category}::text,
          amount = ${amount}::int,
          supplier = ${supplier},
          comment = ${comment},
          updated_at = now()
      where id = ${id}::uuid
      returning id, date, category, amount, supplier, comment, created_at, updated_at
    `;

    const r = updated?.[0];
    if (!r) return jsonNoStore({ error: 'Не найдено' }, 404);

    return jsonNoStore(
      {
        id: String(r.id),
        date: toISODate(r.date),
        category: String(r.category),
        amount: Number(r.amount) || 0,
        supplier: r.supplier ? String(r.supplier) : null,
        comment: r.comment ? String(r.comment) : null,
        created_at: toISODateTime(r.created_at),
        updated_at: r.updated_at ? toISODateTime(r.updated_at) : null,
      },
      200
    );
  } catch {
    return jsonNoStore({ error: 'Ошибка обновления расхода' }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = String(body?.id || '');
    if (!id) return jsonNoStore({ error: 'Некорректные данные' }, 400);

    await prisma.$executeRaw`
      delete from public.finance_expenses
      where id = ${id}::uuid
    `;

    return jsonNoStore({ ok: true }, 200);
  } catch {
    return jsonNoStore({ error: 'Ошибка удаления' }, 500);
  }
}
