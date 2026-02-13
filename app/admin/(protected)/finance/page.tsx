// ✅ Путь: app/admin/(protected)/finance/page.tsx
import { prisma } from '@/lib/prisma';
import FinanceClient from './FinanceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ManualRevenueRow = {
  id: string;
  date: string; // yyyy-mm-dd
  source: string;
  amount: number;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
};

type ExpenseRow = {
  id: string;
  date: string; // yyyy-mm-dd
  category: string;
  amount: number;
  supplier: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
};

type SiteOrderRow = {
  id: string;
  created_at: string | null;
  total: string | number | null; // numeric может прийти строкой
  order_number: number | null;
  status: string | null;

  // ✅ добавили
  cost_total: number; // int рубли
  has_costs: boolean;
};

function toISODateFromAny(v: any): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toISODateTimeFromAny(v: any): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function toNumberSafe(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function toIntSafe(v: any): number {
  const n = toNumberSafe(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export default async function FinancePage() {
  // 1) Ручная выручка
  const manualRevenueRaw = await prisma.$queryRaw<any[]>`
    select
      id,
      date,
      source,
      amount,
      comment,
      created_at,
      updated_at
    from public.finance_manual_revenue
    order by date desc, created_at desc
    limit 500
  `;

  const manualRevenue: ManualRevenueRow[] = (manualRevenueRaw || []).map((r) => ({
    id: String(r.id),
    date: toISODateFromAny(r.date),
    source: String(r.source),
    amount: toIntSafe(r.amount),
    comment: r.comment ? String(r.comment) : null,
    created_at: toISODateTimeFromAny(r.created_at),
    updated_at: r.updated_at ? toISODateTimeFromAny(r.updated_at) : null,
  }));

  // 2) Расходы
  const expensesRaw = await prisma.$queryRaw<any[]>`
    select
      id,
      date,
      category,
      amount,
      supplier,
      comment,
      created_at,
      updated_at
    from public.finance_expenses
    order by date desc, created_at desc
    limit 500
  `;

  const expenses: ExpenseRow[] = (expensesRaw || []).map((e) => ({
    id: String(e.id),
    date: toISODateFromAny(e.date),
    category: String(e.category),
    amount: toIntSafe(e.amount),
    supplier: e.supplier ? String(e.supplier) : null,
    comment: e.comment ? String(e.comment) : null,
    created_at: toISODateTimeFromAny(e.created_at),
    updated_at: e.updated_at ? toISODateTimeFromAny(e.updated_at) : null,
  }));

  // 3) Заказы сайта + себестоимость (order_costs)
  const ordersRaw = await prisma.$queryRaw<any[]>`
    select
      o.id,
      o.created_at,
      o.total,
      o.order_number,
      o.status,

      oc.order_id as oc_order_id,

      coalesce(oc.strawberries_cost, 0)
      + coalesce(oc.flowers_cost, 0)
      + coalesce(oc.chocolate_cost, 0)
      + coalesce(oc.packaging_cost, 0)
      + coalesce(oc.supply_taxi_cost, 0)
      + coalesce(oc.other_cost, 0) as cost_total

    from public.orders o
    left join public.order_costs oc on oc.order_id = o.id
    order by o.created_at desc
    limit 500
  `;

  const siteOrders: SiteOrderRow[] = (ordersRaw || []).map((o) => ({
    id: String(o.id),
    created_at: o.created_at ? toISODateTimeFromAny(o.created_at) : null,
    total: o.total ?? null,
    order_number: o.order_number !== null && o.order_number !== undefined ? Number(o.order_number) : null,
    status: o.status ? String(o.status) : null,

    cost_total: toIntSafe(o.cost_total),
    has_costs: Boolean(o.oc_order_id),
  }));

  return (
    <FinanceClient
      initialManualRevenue={manualRevenue}
      initialExpenses={expenses}
      initialSiteOrders={siteOrders}
    />
  );
}
