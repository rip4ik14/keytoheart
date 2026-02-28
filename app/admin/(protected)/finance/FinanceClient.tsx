// ✅ Путь: app/admin/(protected)/finance/FinanceClient.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const sources = [
  'flowwow',
  'whatsapp',
  'telegram',
  'offline',
  'instagram',
  'yandex_maps',
  '2gis',
  'max',
  'vk',
] as const;
type Source = (typeof sources)[number];

const expenseCategories = [
  'Клубника',
  'Цветы',
  'Шоколад',
  'Упаковка',
  'Доставка/такси',
  'Аренда',
  'Реклама',
  'Бизнес подписки',
  'Налоги',
  'Прочее',
] as const;
type ExpenseCategory = (typeof expenseCategories)[number];

type ManualRevenueRow = {
  id: string;
  date: string; // yyyy-mm-dd
  source: string;
  amount: number;
  comment: string | null;
  created_at: string;
  updated_at?: string | null;
};

type ExpenseRow = {
  id: string;
  date: string; // yyyy-mm-dd
  category: string;
  amount: number;
  supplier: string | null;
  comment: string | null;
  created_at: string;
  updated_at?: string | null;
};

type SiteOrderRow = {
  id: string;
  created_at: string | null;
  total: string | number | null;
  order_number: number | null;
  status: string | null;

  cost_total: number; // int рубли
  has_costs: boolean;
};

type Props = {
  initialManualRevenue: ManualRevenueRow[];
  initialExpenses: ExpenseRow[];
  initialSiteOrders: SiteOrderRow[];
};

type Tab = 'overview' | 'income' | 'expenses';
type PeriodPreset = 'all' | '7d' | '30d' | 'this_month' | 'custom';
type Granularity = 'day' | 'week' | 'month';
type SourceChartMetric = 'count' | 'amount';

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function startOfThisMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function toIntRubFromInput(v: string): number {
  const n = Number(v.replace(',', '.').trim());
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function formatRub(n: number) {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n)} ₽`;
  }
}

function safeDiv(a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return a / b;
}

function getOrderTotal(o: SiteOrderRow): number {
  if (o.total === null || o.total === undefined) return 0;
  if (typeof o.total === 'number') return Math.round(o.total);
  const n = Number(String(o.total).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function getOrderDateISO(o: SiteOrderRow): string {
  if (!o.created_at) return '';
  const d = new Date(o.created_at);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const mskDtf = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function formatMskDateTime(iso: string | null | undefined) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';

  const parts = mskDtf.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const day = get('day');
  const month = get('month');
  const year = get('year');
  const hour = get('hour');
  const minute = get('minute');

  return `${day}.${month}.${year} ${hour}:${minute}`;
}

function isRevenueStatus(status: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === 'delivered' || s === 'processing';
}

function inDateRange(isoDate: string, from?: string, to?: string) {
  if (!isoDate) return false;
  if (from && isoDate < from) return false;
  if (to && isoDate > to) return false;
  return true;
}

function sourceLabel(s: Source) {
  switch (s) {
    case 'flowwow':
      return 'Flowwow';
    case 'whatsapp':
      return 'WhatsApp';
    case 'telegram':
      return 'Telegram';
    case 'offline':
      return 'Оффлайн';
    case 'instagram':
      return 'Instagram';
    case 'yandex_maps':
      return 'Яндекс карты';
    case '2gis':
      return '2ГИС';
    case 'max':
      return 'MAX';
    case 'vk':
      return 'VK';
    default:
      return s;
  }
}

function isoToDateLocal(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatShortRu(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

function formatMonthRu(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${mm}.${yyyy}`;
}

function mondayOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diffToMon = (day + 6) % 7;
  x.setDate(x.getDate() - diffToMon);
  return x;
}

function bucketFromISO(iso: string, granularity: Granularity) {
  const base = isoToDateLocal(iso);

  if (granularity === 'month') {
    const m = new Date(base.getFullYear(), base.getMonth(), 1);
    return {
      key: `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`,
      label: formatMonthRu(m),
      sortKey: m.getTime(),
    };
  }

  if (granularity === 'week') {
    const mon = mondayOfWeek(base);
    const monIso = mon.toISOString().slice(0, 10);
    return { key: monIso, label: formatShortRu(mon), sortKey: mon.getTime() };
  }

  const sd = startOfDay(base);
  return { key: iso, label: formatShortRu(sd), sortKey: sd.getTime() };
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function escapeCSV(value: any) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function FinanceClient({ initialManualRevenue, initialExpenses, initialSiteOrders }: Props) {
  const [tab, setTab] = useState<Tab>('overview');

  const [manualRevenue, setManualRevenue] = useState<ManualRevenueRow[]>(initialManualRevenue);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses);

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_month');
  const [fromDate, setFromDate] = useState<string>(startOfThisMonthISO());
  const [toDate, setToDate] = useState<string>(todayISO());

  const [selectedSources, setSelectedSources] = useState<Source[]>(() => [...sources]);

  const [granularity, setGranularity] = useState<Granularity>('day');
  const [sourceMetric, setSourceMetric] = useState<SourceChartMetric>('count');

  const [newIncome, setNewIncome] = useState<{ date: string; source: Source; amount: string; comment: string }>({
    date: todayISO(),
    source: 'flowwow',
    amount: '',
    comment: '',
  });

  const [newExpense, setNewExpense] = useState<{
    date: string;
    category: ExpenseCategory;
    amount: string;
    supplier: string;
    comment: string;
  }>({
    date: todayISO(),
    category: 'Клубника',
    amount: '',
    supplier: '',
    comment: '',
  });

  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [editIncome, setEditIncome] = useState<{ date: string; source: Source; amount: string; comment: string }>({
    date: todayISO(),
    source: 'flowwow',
    amount: '',
    comment: '',
  });

  const [editExpense, setEditExpense] = useState<{
    date: string;
    category: ExpenseCategory;
    amount: string;
    supplier: string;
    comment: string;
  }>({
    date: todayISO(),
    category: 'Клубника',
    amount: '',
    supplier: '',
    comment: '',
  });

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const range = useMemo(() => {
    if (periodPreset === 'all') return { from: undefined as string | undefined, to: undefined as string | undefined };

    if (periodPreset === '7d') return { from: daysAgoISO(7), to: todayISO() };
    if (periodPreset === '30d') return { from: daysAgoISO(30), to: todayISO() };
    if (periodPreset === 'this_month') return { from: startOfThisMonthISO(), to: todayISO() };

    return {
      from: fromDate || undefined,
      to: toDate || undefined,
    };
  }, [periodPreset, fromDate, toDate]);

  const revenueOrdersAll = useMemo(() => initialSiteOrders.filter((o) => isRevenueStatus(o.status)), [initialSiteOrders]);

  const filteredRevenueOrders = useMemo(() => {
    const { from, to } = range;
    return revenueOrdersAll.filter((o) => inDateRange(getOrderDateISO(o), from, to));
  }, [revenueOrdersAll, range]);

  const filteredManualRevenue = useMemo(() => {
    const { from, to } = range;

    const allowed = new Set<Source>(selectedSources);
    return manualRevenue.filter((r) => {
      const inRange = inDateRange(r.date, from, to);
      if (!inRange) return false;

      const src = sources.includes(r.source as any) ? (r.source as Source) : null;
      if (!src) return false;

      return allowed.has(src);
    });
  }, [manualRevenue, range, selectedSources]);

  const filteredExpenses = useMemo(() => {
    const { from, to } = range;
    return expenses.filter((e) => inDateRange(e.date, from, to));
  }, [expenses, range]);

  const totals = useMemo(() => {
    const siteRevenue = filteredRevenueOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
    const siteCosts = filteredRevenueOrders.reduce((sum, o) => sum + Math.max(0, Math.round(o.cost_total || 0)), 0);

    const manual = filteredManualRevenue.reduce((a, r) => a + (r.amount || 0), 0);
    const exp = filteredExpenses.reduce((a, e) => a + (e.amount || 0), 0);

    const profit = siteRevenue + manual - exp - siteCosts;

    const ordersCount = filteredRevenueOrders.length;
    const costsFilled = filteredRevenueOrders.filter((o) => o.has_costs).length;

    return { siteRevenue, siteCosts, manualRevenue: manual, expenses: exp, profit, ordersCount, costsFilled };
  }, [filteredRevenueOrders, filteredManualRevenue, filteredExpenses]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredExpenses) {
      const key = e.category || 'Прочее';
      map.set(key, (map.get(key) || 0) + (e.amount || 0));
    }
    const rows = Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const total = rows.reduce((s, r) => s + r.amount, 0);
    return { rows, total };
  }, [filteredExpenses]);

  const manualBySource = useMemo(() => {
    const map = new Map<Source, { source: Source; label: string; count: number; amount: number }>();
    for (const s of sources) map.set(s, { source: s, label: sourceLabel(s), count: 0, amount: 0 });

    for (const r of filteredManualRevenue) {
      const src = sources.includes(r.source as any) ? (r.source as Source) : null;
      if (!src) continue;
      const cur = map.get(src);
      if (!cur) continue;
      cur.count += 1;
      cur.amount += Math.max(0, Math.round(r.amount || 0));
      map.set(src, cur);
    }

    const rows = Array.from(map.values())
      .filter((x) => x.count > 0 || x.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return rows.map((r) => ({
      ...r,
      avg: r.count > 0 ? Math.round(r.amount / r.count) : 0,
    }));
  }, [filteredManualRevenue]);

  const series = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        sortKey: number;
        siteOrders: number;
        manualOrders: number;
        siteRevenue: number;
        manualRevenue: number;
        expenses: number;
        siteCosts: number;
      }
    >();

    function ensure(isoDate: string) {
      const b = bucketFromISO(isoDate, granularity);
      const cur =
        map.get(b.key) ??
        {
          key: b.key,
          label: b.label,
          sortKey: b.sortKey,
          siteOrders: 0,
          manualOrders: 0,
          siteRevenue: 0,
          manualRevenue: 0,
          expenses: 0,
          siteCosts: 0,
        };
      map.set(b.key, cur);
      return cur;
    }

    for (const o of filteredRevenueOrders) {
      const iso = getOrderDateISO(o);
      if (!iso) continue;
      const cur = ensure(iso);
      cur.siteOrders += 1;
      cur.siteRevenue += getOrderTotal(o);
      cur.siteCosts += Math.max(0, Math.round(o.cost_total || 0));
    }

    for (const r of filteredManualRevenue) {
      const iso = r.date;
      if (!iso) continue;
      const cur = ensure(iso);
      cur.manualOrders += 1;
      cur.manualRevenue += Math.max(0, Math.round(r.amount || 0));
    }

    for (const e of filteredExpenses) {
      const iso = e.date;
      if (!iso) continue;
      const cur = ensure(iso);
      cur.expenses += Math.max(0, Math.round(e.amount || 0));
    }

    return Array.from(map.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((r) => {
        const totalRevenue = r.siteRevenue + r.manualRevenue;
        const profit = totalRevenue - r.expenses - r.siteCosts;
        return { ...r, totalRevenue, profit };
      });
  }, [filteredRevenueOrders, filteredManualRevenue, filteredExpenses, granularity]);

  const siteAvgCheck = useMemo(() => (totals.ordersCount > 0 ? Math.round(totals.siteRevenue / totals.ordersCount) : 0), [totals.ordersCount, totals.siteRevenue]);
  const manualOrdersCount = useMemo(() => filteredManualRevenue.length, [filteredManualRevenue]);
  const manualAvgCheck = useMemo(() => (manualOrdersCount > 0 ? Math.round(totals.manualRevenue / manualOrdersCount) : 0), [manualOrdersCount, totals.manualRevenue]);

  const totalRevenueAll = useMemo(() => totals.siteRevenue + totals.manualRevenue, [totals.siteRevenue, totals.manualRevenue]);

  const siteMargin = useMemo(() => totals.siteRevenue - totals.siteCosts, [totals.siteRevenue, totals.siteCosts]);
  const siteMarginPct = useMemo(() => Math.round(safeDiv(siteMargin, Math.max(1, totals.siteRevenue)) * 100), [siteMargin, totals.siteRevenue]);

  const worstDays = useMemo(() => series.filter((r) => r.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 5), [series]);

  const ordersWithoutCosts = useMemo(() => {
    return filteredRevenueOrders
      .filter((o) => !o.has_costs)
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
      .slice(0, 12);
  }, [filteredRevenueOrders]);

  function buildOrdersLink(opts: { q?: string; open?: string; from?: string; to?: string; status?: string }) {
    const params = new URLSearchParams();
    if (opts.q) params.set('q', opts.q);
    if (opts.open) params.set('open', opts.open);
    if (opts.status) params.set('status', opts.status);
    if (opts.from) params.set('from', opts.from);
    if (opts.to) params.set('to', opts.to);
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  }

  function applyPreset(p: PeriodPreset) {
    setPeriodPreset(p);
    if (p === 'custom') return;

    if (p === '7d') {
      setFromDate(daysAgoISO(7));
      setToDate(todayISO());
      return;
    }
    if (p === '30d') {
      setFromDate(daysAgoISO(30));
      setToDate(todayISO());
      return;
    }
    if (p === 'this_month') {
      setFromDate(startOfThisMonthISO());
      setToDate(todayISO());
      return;
    }
    if (p === 'all') {
      setFromDate('');
      setToDate('');
    }
  }

  function toggleSource(s: Source) {
    setSelectedSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function selectAllSources() {
    setSelectedSources([...sources]);
  }

  function clearSources() {
    setSelectedSources([]);
  }

  function exportFinanceCSV() {
    const periodText =
      periodPreset === 'custom'
        ? `${fromDate || ''} - ${toDate || ''}`
        : periodPreset === 'this_month'
          ? 'this_month'
          : periodPreset;

    const summary = [
      ['Период', periodText],
      ['Выручка (сайт + ручная)', totalRevenueAll],
      ['Выручка сайта', totals.siteRevenue],
      ['Себестоимость сайта', totals.siteCosts],
      ['Маржа сайта', siteMargin],
      ['Маржа сайта (%)', siteMarginPct],
      ['Ручная выручка', totals.manualRevenue],
      ['Расходы', totals.expenses],
      ['Прибыль', totals.profit],
      ['Заказы сайта', totals.ordersCount],
      ['Средний чек сайта', siteAvgCheck],
      ['Ручные заказы', manualOrdersCount],
      ['Средний чек ручной', manualAvgCheck],
    ];

    const bySourceHeader = ['Источник', 'Кол-во', 'Сумма', 'Средний чек'];
    const bySourceRows = manualBySource.map((r) => [r.label, r.count, r.amount, r.avg]);

    const seriesHeader = ['Период', 'Заказы сайта', 'Заказы ручные', 'Выручка общая', 'Прибыль', 'Расходы', 'Себестоимость'];
    const seriesRows = series.map((r) => [r.label, r.siteOrders, r.manualOrders, r.totalRevenue, r.profit, r.expenses, r.siteCosts]);

    const csv = [
      ['Метрика', 'Значение'].join(','),
      ...summary.map((row) => row.map(escapeCSV).join(',')),
      '',
      'Ручная выручка по источникам',
      bySourceHeader.join(','),
      ...bySourceRows.map((row) => row.map(escapeCSV).join(',')),
      '',
      'Динамика',
      seriesHeader.join(','),
      ...seriesRows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    downloadCSV('finance.csv', csv);
  }

  async function addManualRevenue() {
    setErrorText(null);
    const amountInt = toIntRubFromInput(newIncome.amount);

    if (!newIncome.date || amountInt <= 0) {
      setErrorText('Заполни дату и сумму больше 0');
      return;
    }

    setLoadingAction('add-income');
    try {
      const res = await fetch('/api/admin/finance/manual-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newIncome.date,
          source: newIncome.source,
          amount: amountInt,
          comment: newIncome.comment || null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErrorText(j?.error || 'Ошибка добавления дохода');
        return;
      }

      const created: ManualRevenueRow = await res.json();
      setManualRevenue((prev) => [created, ...prev]);

      setNewIncome((p) => ({ ...p, amount: '', comment: '' }));
    } finally {
      setLoadingAction(null);
    }
  }

  async function addExpense() {
    setErrorText(null);
    const amountInt = toIntRubFromInput(newExpense.amount);

    if (!newExpense.date || amountInt <= 0) {
      setErrorText('Заполни дату и сумму больше 0');
      return;
    }

    setLoadingAction('add-expense');
    try {
      const res = await fetch('/api/admin/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newExpense.date,
          category: newExpense.category,
          amount: amountInt,
          supplier: newExpense.supplier || null,
          comment: newExpense.comment || null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErrorText(j?.error || 'Ошибка добавления расхода');
        return;
      }

      const created: ExpenseRow = await res.json();
      setExpenses((prev) => [created, ...prev]);

      setNewExpense((p) => ({ ...p, amount: '', supplier: '', comment: '' }));
    } finally {
      setLoadingAction(null);
    }
  }

  function openEditIncome(row: ManualRevenueRow) {
    setErrorText(null);
    setEditingIncomeId(row.id);
    setEditIncome({
      date: row.date,
      source: (sources.includes(row.source as any) ? (row.source as Source) : 'flowwow'),
      amount: String(row.amount ?? ''),
      comment: row.comment ?? '',
    });
  }

  function openEditExpense(row: ExpenseRow) {
    setErrorText(null);
    setEditingExpenseId(row.id);
    const cat = expenseCategories.includes(row.category as any) ? (row.category as ExpenseCategory) : 'Прочее';
    setEditExpense({
      date: row.date,
      category: cat,
      amount: String(row.amount ?? ''),
      supplier: row.supplier ?? '',
      comment: row.comment ?? '',
    });
  }

  async function saveEditIncome() {
    if (!editingIncomeId) return;
    setErrorText(null);

    const amountInt = toIntRubFromInput(editIncome.amount);
    if (!editIncome.date || amountInt <= 0) {
      setErrorText('Заполни дату и сумму больше 0');
      return;
    }

    setLoadingAction('save-income');
    try {
      const res = await fetch('/api/admin/finance/manual-revenue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingIncomeId,
          date: editIncome.date,
          source: editIncome.source,
          amount: amountInt,
          comment: editIncome.comment || null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErrorText(j?.error || 'Ошибка сохранения дохода');
        return;
      }

      const updated: ManualRevenueRow = await res.json();
      setManualRevenue((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingIncomeId(null);
    } finally {
      setLoadingAction(null);
    }
  }

  async function saveEditExpense() {
    if (!editingExpenseId) return;
    setErrorText(null);

    const amountInt = toIntRubFromInput(editExpense.amount);
    if (!editExpense.date || amountInt <= 0) {
      setErrorText('Заполни дату и сумму больше 0');
      return;
    }

    setLoadingAction('save-expense');
    try {
      const res = await fetch('/api/admin/finance/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingExpenseId,
          date: editExpense.date,
          category: editExpense.category,
          amount: amountInt,
          supplier: editExpense.supplier || null,
          comment: editExpense.comment || null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErrorText(j?.error || 'Ошибка сохранения расхода');
        return;
      }

      const updated: ExpenseRow = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditingExpenseId(null);
    } finally {
      setLoadingAction(null);
    }
  }

  async function deleteIncome(id: string) {
    setErrorText(null);
    setLoadingAction('delete-income');
    try {
      const res = await fetch('/api/admin/finance/manual-revenue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErrorText(j?.error || 'Ошибка удаления дохода');
        return;
      }

      setManualRevenue((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setLoadingAction(null);
    }
  }

  async function deleteExpense(id: string) {
    setErrorText(null);
    setLoadingAction('delete-expense');
    try {
      const res = await fetch('/api/admin/finance/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErrorText(j?.error || 'Ошибка удаления расхода');
        return;
      }

      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setLoadingAction(null);
    }
  }

  const disableButtons = loadingAction !== null;

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Финансы</h1>
          <p className="text-sm text-gray-500 mt-1">Доходы и расходы, прибыль с учётом себестоимости</p>
          <p className="text-xs text-gray-400 mt-1">Выручка сайта: delivered, processing. Отменённые и pending не считаем.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs text-gray-500">Период:</div>

            <button
              onClick={() => applyPreset('this_month')}
              className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                periodPreset === 'this_month' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Этот месяц
            </button>
            <button
              onClick={() => applyPreset('7d')}
              className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                periodPreset === '7d' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
              }`}
            >
              7 дней
            </button>
            <button
              onClick={() => applyPreset('30d')}
              className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                periodPreset === '30d' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
              }`}
            >
              30 дней
            </button>
            <button
              onClick={() => applyPreset('all')}
              className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                periodPreset === 'all' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Всё время
            </button>

            <button
              onClick={() => applyPreset('custom')}
              className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                periodPreset === 'custom' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Свой
            </button>

            {periodPreset === 'custom' ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[150px] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <div className="text-xs text-gray-400">-</div>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[150px] border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab('overview')}
              className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                tab === 'overview' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Аналитика
            </button>
            <button
              onClick={() => setTab('income')}
              className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                tab === 'income' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Доходы
            </button>
            <button
              onClick={() => setTab('expenses')}
              className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                tab === 'expenses' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Расходы
            </button>
          </div>
        </div>
      </div>

      {errorText ? (
        <div className="mt-4 border border-red-200 bg-red-50 text-red-700 text-sm rounded-xl p-3">{errorText}</div>
      ) : null}

      <div className="grid gap-3 mt-6 sm:grid-cols-2 lg:grid-cols-6">
        <div className="border rounded-xl p-4 lg:col-span-2">
          <div className="text-xs text-gray-500">Выручка (сайт + ручная)</div>
          <div className="text-lg font-semibold mt-1">{formatRub(totalRevenueAll)}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            сайт: {formatRub(totals.siteRevenue)} | ручная: {formatRub(totals.manualRevenue)}
          </div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Прибыль</div>
          <div className="text-lg font-semibold mt-1">{formatRub(totals.profit)}</div>
          <div className="text-[11px] text-gray-400 mt-1">выручка - расходы - себестоимость</div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Заказы сайта</div>
          <div className="text-lg font-semibold mt-1">{totals.ordersCount}</div>
          <div className="text-[11px] text-gray-400 mt-1">ср. чек: {formatRub(siteAvgCheck)}</div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Ручные заказы</div>
          <div className="text-lg font-semibold mt-1">{manualOrdersCount}</div>
          <div className="text-[11px] text-gray-400 mt-1">ср. чек: {formatRub(manualAvgCheck)}</div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Маржа сайта</div>
          <div className="text-lg font-semibold mt-1">{formatRub(siteMargin)}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            {siteMarginPct}% | себестоимость заполнена: {totals.costsFilled}/{totals.ordersCount}
          </div>
        </div>
      </div>

      {tab === 'overview' ? (
        <section className="mt-8 space-y-6">
          <div className="border rounded-xl p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-medium">Источники заказов (ручные)</div>
                <div className="text-xs text-gray-500 mt-1">Фильтр влияет на графики и суммы ручной части</div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
                <button
                  onClick={selectAllSources}
                  className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  Все
                </button>
                <button
                  onClick={clearSources}
                  className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  Очистить
                </button>
                <button
                  onClick={exportFinanceCSV}
                  className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  Экспорт CSV
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((s) => {
                const active = selectedSources.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSource(s)}
                    className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                      active ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {sourceLabel(s)}
                  </button>
                );
              })}
            </div>

            {selectedSources.length === 0 ? (
              <div className="mt-3 text-xs text-gray-500">Ничего не выбрано - ручная часть будет нулевая</div>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="border rounded-xl p-4 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">Ручные заказы по источникам</div>
                  <div className="text-xs text-gray-500 mt-1">кол-во или сумма</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSourceMetric('count')}
                    className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                      sourceMetric === 'count' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    Кол-во
                  </button>
                  <button
                    onClick={() => setSourceMetric('amount')}
                    className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                      sourceMetric === 'amount' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    Сумма
                  </button>
                </div>
              </div>

              <div className="mt-4 h-[320px]">
                {manualBySource.length === 0 ? (
                  <div className="text-sm text-gray-500">Нет данных по выбранным источникам</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={manualBySource.map((r) => ({ name: r.label, count: r.count, amount: r.amount }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(v: any, n: any) => {
                          if (n === 'amount') return [formatRub(Number(v || 0)), 'Сумма'];
                          return [Number(v || 0), 'Кол-во'];
                        }}
                      />
                      <Bar dataKey={sourceMetric} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="mt-4 border-t pt-3">
                <div className="text-xs text-gray-500 mb-2">Сводка (источник - кол-во - сумма - ср. чек)</div>
                <div className="space-y-2">
                  {manualBySource.length === 0 ? (
                    <div className="text-sm text-gray-500">Пока пусто</div>
                  ) : (
                    manualBySource.slice(0, 8).map((r) => (
                      <div key={r.source} className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium truncate">{r.label}</div>
                        <div className="text-sm text-gray-700 whitespace-nowrap">
                          {r.count} - {formatRub(r.amount)} - {formatRub(r.avg)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 lg:col-span-2">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium">Динамика: выручка и прибыль</div>
                  <div className="text-xs text-gray-500 mt-1">сайт + ручная - расходы - себестоимость</div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xs text-gray-500">Группировка:</div>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value as Granularity)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="day">Дни</option>
                    <option value="week">Недели</option>
                    <option value="month">Месяцы</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Выручка общая и прибыль</div>
                  <div className="mt-3 h-[260px]">
                    {series.length === 0 ? (
                      <div className="text-sm text-gray-500">Нет данных за период</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(v: any, n: any) => {
                              if (n === 'totalRevenue') return [formatRub(Number(v || 0)), 'Выручка'];
                              if (n === 'profit') return [formatRub(Number(v || 0)), 'Прибыль'];
                              return [v, n];
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="totalRevenue" stroke="#111827" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="profit" stroke="#6b7280" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Заказы: сайт vs ручные</div>
                  <div className="mt-3 h-[260px]">
                    {series.length === 0 ? (
                      <div className="text-sm text-gray-500">Нет данных за период</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="siteOrders" name="Сайт" />
                          <Bar dataKey="manualOrders" name="Ручные" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Контроль</div>
                    <div className="text-xs text-gray-500 mt-1">что требует внимания, чтобы прибыль считалась честно</div>
                  </div>

                  <Link
                    href={buildOrdersLink({
                      from: range.from,
                      to: range.to,
                    })}
                    className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    Открыть заказы
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="border rounded-xl p-3">
                    <div className="text-xs text-gray-500">Заказы сайта без себестоимости</div>
                    <div className="text-sm font-semibold mt-1">
                      {Math.max(0, totals.ordersCount - totals.costsFilled)} шт.
                    </div>

                    {ordersWithoutCosts.length === 0 ? (
                      <div className="mt-3 text-sm text-gray-500">В выбранном периоде всё заполнено</div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {ordersWithoutCosts.map((o) => {
                          const num = o.order_number ? `#${o.order_number}` : o.id.slice(0, 8);
                          const q = o.order_number ? `#${o.order_number}` : '';
                          const href = buildOrdersLink({
                            q,
                            open: o.id,
                            from: range.from,
                            to: range.to,
                          });

                          return (
                            <div key={o.id} className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {num} - {formatRub(getOrderTotal(o))}
                                </div>
                                <div className="text-[11px] text-gray-500">{formatMskDateTime(o.created_at)}</div>
                              </div>

                              <Link
                                href={href}
                                className="px-3 py-2 text-sm rounded-lg bg-black text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black"
                              >
                                Открыть
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="border rounded-xl p-3">
                    <div className="text-xs text-gray-500">Дни в минус (топ)</div>

                    {worstDays.length === 0 ? (
                      <div className="mt-3 text-sm text-gray-500">Нет отрицательных дней (по текущим данным)</div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {worstDays.map((d) => (
                          <div key={d.key} className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium">{d.label}</div>
                            <div className="text-sm text-gray-700 whitespace-nowrap">
                              {formatRub(d.profit)}
                            </div>
                          </div>
                        ))}
                        <div className="text-[11px] text-gray-500 pt-1">
                          если день в минус - чаще всего не заполнена себестоимость или вбиты расходы не в тот день
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {worstDays.length > 0 ? (
                <div className="mt-4 text-xs text-gray-500">
                  хочешь - добавлю второй контроль: “расходы больше выручки” (без учёта себестоимости) и кнопку “проверить”
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'income' ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Доходы</h2>

          <div className="mt-4 border rounded-xl p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-medium">Источники заказов (ручная выручка)</div>
                <div className="text-xs text-gray-500 mt-1">Фильтр влияет на сумму ручной выручки и список ниже</div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
                <button
                  onClick={selectAllSources}
                  className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  Все
                </button>
                <button
                  onClick={clearSources}
                  className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  Очистить
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((s) => {
                const active = selectedSources.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSource(s)}
                    className={`px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black ${
                      active ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {sourceLabel(s)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border rounded-xl p-4">
            <div className="text-sm font-medium">Добавить ручную выручку</div>

            <div className="grid gap-3 mt-3 md:grid-cols-4">
              <div>
                <label className="text-xs text-gray-500">Дата</label>
                <input
                  type="date"
                  value={newIncome.date}
                  onChange={(e) => setNewIncome((p) => ({ ...p, date: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Канал</label>
                <select
                  value={newIncome.source}
                  onChange={(e) => setNewIncome((p) => ({ ...p, source: e.target.value as Source }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="flowwow">Flowwow</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="instagram">Instagram</option>
                  <option value="vk">VK</option>
                  <option value="max">MAX</option>
                  <option value="yandex_maps">Яндекс карты</option>
                  <option value="2gis">2ГИС</option>
                  <option value="offline">Оффлайн</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Сумма (₽)</label>
                <input
                  inputMode="numeric"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="например 15000"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Комментарий</label>
                <input
                  value={newIncome.comment}
                  onChange={(e) => setNewIncome((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="необязательно"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <button
              disabled={disableButtons}
              onClick={addManualRevenue}
              className="mt-4 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {loadingAction === 'add-income' ? 'Добавляю...' : 'Добавить'}
            </button>
          </div>

          <div className="mt-6 border rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-gray-50 text-sm font-medium">История ручной выручки (по выбранному периоду)</div>

            <div className="divide-y">
              {filteredManualRevenue.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Пока пусто</div>
              ) : (
                filteredManualRevenue.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {r.date} - {sourceLabel((sources.includes(r.source as any) ? (r.source as Source) : 'offline') as Source)} -{' '}
                        {formatRub(r.amount)}
                      </div>
                      {r.comment ? <div className="text-xs text-gray-500 mt-1">{r.comment}</div> : null}
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={disableButtons}
                        onClick={() => openEditIncome(r)}
                        className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        Редактировать
                      </button>
                      <button
                        disabled={disableButtons}
                        onClick={() => deleteIncome(r.id)}
                        className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        {loadingAction === 'delete-income' ? 'Удаляю...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {editingIncomeId ? (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="text-sm font-semibold">Редактировать доход</div>
                  <button
                    disabled={disableButtons}
                    onClick={() => setEditingIncomeId(null)}
                    className="text-sm text-gray-500 hover:text-black disabled:opacity-60 focus:outline-none"
                  >
                    Закрыть
                  </button>
                </div>

                <div className="p-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-gray-500">Дата</label>
                    <input
                      type="date"
                      value={editIncome.date}
                      onChange={(e) => setEditIncome((p) => ({ ...p, date: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Канал</label>
                    <select
                      value={editIncome.source}
                      onChange={(e) => setEditIncome((p) => ({ ...p, source: e.target.value as Source }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="flowwow">Flowwow</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telegram">Telegram</option>
                      <option value="instagram">Instagram</option>
                      <option value="vk">VK</option>
                      <option value="max">MAX</option>
                      <option value="yandex_maps">Яндекс карты</option>
                      <option value="2gis">2ГИС</option>
                      <option value="offline">Оффлайн</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Сумма (₽)</label>
                    <input
                      inputMode="numeric"
                      value={editIncome.amount}
                      onChange={(e) => setEditIncome((p) => ({ ...p, amount: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Комментарий</label>
                    <input
                      value={editIncome.comment}
                      onChange={(e) => setEditIncome((p) => ({ ...p, comment: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="p-4 border-t flex gap-2 justify-end">
                  <button
                    disabled={disableButtons}
                    onClick={() => setEditingIncomeId(null)}
                    className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    Отмена
                  </button>
                  <button
                    disabled={disableButtons}
                    onClick={saveEditIncome}
                    className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {loadingAction === 'save-income' ? 'Сохраняю...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'expenses' ? (
        <section className="mt-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold">Расходы</h2>
            <div className="text-xs text-gray-500">Визуалка показывает, на что уходит больше всего за выбранный период</div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="border rounded-xl p-4">
              <div className="text-sm font-medium">Структура расходов (топ категорий)</div>
              <div className="text-xs text-gray-500 mt-1">Доля и сумма по категориям</div>

              {expensesByCategory.total <= 0 ? (
                <div className="mt-4 text-sm text-gray-500">Пока нет расходов в выбранном периоде</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {expensesByCategory.rows.slice(0, 10).map((r) => {
                    const pct = Math.round((r.amount / expensesByCategory.total) * 100);
                    return (
                      <div key={r.category} className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium truncate">{r.category}</div>
                          <div className="text-sm text-gray-700 whitespace-nowrap">
                            {formatRub(r.amount)} <span className="text-gray-400">({pct}%)</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-2 bg-black" style={{ width: `${Math.max(1, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border rounded-xl p-4">
              <div className="text-sm font-medium">Быстрый вывод</div>
              <div className="text-xs text-gray-500 mt-1">Самые “тяжёлые” статьи</div>

              {expensesByCategory.total <= 0 ? (
                <div className="mt-4 text-sm text-gray-500">Пока нет данных</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {expensesByCategory.rows.slice(0, 3).map((r, idx) => (
                    <div key={r.category} className="border rounded-xl p-3">
                      <div className="text-xs text-gray-500">#{idx + 1} по расходам</div>
                      <div className="text-sm font-semibold mt-1">{r.category}</div>
                      <div className="text-sm text-gray-700 mt-1">{formatRub(r.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border rounded-xl p-4">
            <div className="text-sm font-medium">Добавить расход</div>

            <div className="grid gap-3 mt-3 md:grid-cols-5">
              <div>
                <label className="text-xs text-gray-500">Дата</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense((p) => ({ ...p, date: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Категория</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense((p) => ({ ...p, category: e.target.value as ExpenseCategory }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Сумма (₽)</label>
                <input
                  inputMode="numeric"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="например 3200"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Поставщик</label>
                <input
                  value={newExpense.supplier}
                  onChange={(e) => setNewExpense((p) => ({ ...p, supplier: e.target.value }))}
                  placeholder="необязательно"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Комментарий</label>
                <input
                  value={newExpense.comment}
                  onChange={(e) => setNewExpense((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="необязательно"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <button
              disabled={disableButtons}
              onClick={addExpense}
              className="mt-4 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {loadingAction === 'add-expense' ? 'Добавляю...' : 'Добавить'}
            </button>
          </div>

          <div className="mt-6 border rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-gray-50 text-sm font-medium">История расходов (по выбранному периоду)</div>

            <div className="divide-y">
              {filteredExpenses.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Пока пусто</div>
              ) : (
                filteredExpenses.map((e) => (
                  <div key={e.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {e.date} - {e.category} - {formatRub(e.amount)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {e.supplier ? `Поставщик: ${e.supplier}` : ' '}
                        {e.comment ? ` | ${e.comment}` : ''}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={disableButtons}
                        onClick={() => openEditExpense(e)}
                        className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        Редактировать
                      </button>
                      <button
                        disabled={disableButtons}
                        onClick={() => deleteExpense(e.id)}
                        className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        {loadingAction === 'delete-expense' ? 'Удаляю...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {editingExpenseId ? (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="text-sm font-semibold">Редактировать расход</div>
                  <button
                    disabled={disableButtons}
                    onClick={() => setEditingExpenseId(null)}
                    className="text-sm text-gray-500 hover:text-black disabled:opacity-60 focus:outline-none"
                  >
                    Закрыть
                  </button>
                </div>

                <div className="p-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-gray-500">Дата</label>
                    <input
                      type="date"
                      value={editExpense.date}
                      onChange={(e) => setEditExpense((p) => ({ ...p, date: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Категория</label>
                    <select
                      value={editExpense.category}
                      onChange={(e) => setEditExpense((p) => ({ ...p, category: e.target.value as ExpenseCategory }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      {expenseCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Сумма (₽)</label>
                    <input
                      inputMode="numeric"
                      value={editExpense.amount}
                      onChange={(e) => setEditExpense((p) => ({ ...p, amount: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Поставщик</label>
                    <input
                      value={editExpense.supplier}
                      onChange={(e) => setEditExpense((p) => ({ ...p, supplier: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500">Комментарий</label>
                    <input
                      value={editExpense.comment}
                      onChange={(e) => setEditExpense((p) => ({ ...p, comment: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="p-4 border-t flex gap-2 justify-end">
                  <button
                    disabled={disableButtons}
                    onClick={() => setEditingExpenseId(null)}
                    className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    Отмена
                  </button>
                  <button
                    disabled={disableButtons}
                    onClick={saveEditExpense}
                    className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {loadingAction === 'save-expense' ? 'Сохраняю...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}