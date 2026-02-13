// ✅ Путь: app/admin/(protected)/finance/FinanceClient.tsx
'use client';

import { useMemo, useState } from 'react';

const sources = ['flowwow', 'whatsapp', 'telegram', 'offline'] as const;
type Source = (typeof sources)[number];

const expenseCategories = [
  'Клубника',
  'Цветы',
  'Шоколад',
  'Упаковка',
  'Доставка/такси',
  'Аренда',
  'Реклама',
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

  // ✅ пришло с сервера
  cost_total: number; // int рубли
  has_costs: boolean;
};

type Props = {
  initialManualRevenue: ManualRevenueRow[];
  initialExpenses: ExpenseRow[];
  initialSiteOrders: SiteOrderRow[];
};

type Tab = 'income' | 'expenses';

function todayISO() {
  const d = new Date();
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

function isRevenueStatus(status: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === 'delivered' || s === 'processing';
}

export default function FinanceClient({ initialManualRevenue, initialExpenses, initialSiteOrders }: Props) {
  const [tab, setTab] = useState<Tab>('income');

  const [manualRevenue, setManualRevenue] = useState<ManualRevenueRow[]>(initialManualRevenue);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses);

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

  const revenueOrders = useMemo(() => {
    // только те, что идут в выручку и прибыль
    return initialSiteOrders.filter((o) => isRevenueStatus(o.status));
  }, [initialSiteOrders]);

  const totals = useMemo(() => {
    const siteRevenue = revenueOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
    const siteCosts = revenueOrders.reduce((sum, o) => sum + Math.max(0, Math.round(o.cost_total || 0)), 0);

    const manual = manualRevenue.reduce((a, r) => a + (r.amount || 0), 0);
    const exp = expenses.reduce((a, e) => a + (e.amount || 0), 0);

    const profit = siteRevenue + manual - exp - siteCosts;

    const ordersCount = revenueOrders.length;
    const costsFilled = revenueOrders.filter((o) => o.has_costs).length;

    return { siteRevenue, siteCosts, manualRevenue: manual, expenses: exp, profit, ordersCount, costsFilled };
  }, [revenueOrders, manualRevenue, expenses]);

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Финансы</h1>
          <p className="text-sm text-gray-500 mt-1">Доходы и расходы, прибыль с учётом себестоимости</p>
          <p className="text-xs text-gray-400 mt-1">Выручка сайта: delivered, processing. Отменённые и pending не считаем.</p>
        </div>

        <div className="flex gap-2">
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

      {errorText ? (
        <div className="mt-4 border border-red-200 bg-red-50 text-red-700 text-sm rounded-xl p-3">{errorText}</div>
      ) : null}

      <div className="grid gap-3 mt-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Выручка сайта</div>
          <div className="text-lg font-semibold mt-1">{formatRub(totals.siteRevenue)}</div>
          <div className="text-[11px] text-gray-400 mt-1">заказы: {totals.ordersCount}</div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Себестоимость сайта</div>
          <div className="text-lg font-semibold mt-1">{formatRub(totals.siteCosts)}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            заполнено: {totals.costsFilled}/{totals.ordersCount}
          </div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Ручная выручка</div>
          <div className="text-lg font-semibold mt-1">{formatRub(totals.manualRevenue)}</div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Расходы</div>
          <div className="text-lg font-semibold mt-1">{formatRub(totals.expenses)}</div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="text-xs text-gray-500">Прибыль</div>
          <div className="text-lg font-semibold mt-1">{formatRub(totals.profit)}</div>
          <div className="text-[11px] text-gray-400 mt-1">сайт + ручная - расходы - себестоимость</div>
        </div>
      </div>

      {/* UI вкладок дальше оставляю как у тебя, без изменений по верстке, только логика денег уже int */}
      {/* Ниже твой UI 1:1, я не трогаю оформление, только disabled/loading/error */}
      {tab === 'income' ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Доходы</h2>

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
            <div className="p-4 border-b bg-gray-50 text-sm font-medium">История ручной выручки</div>

            <div className="divide-y">
              {manualRevenue.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Пока пусто</div>
              ) : (
                manualRevenue.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {r.date} - {r.source} - {formatRub(r.amount)}
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
      ) : (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Расходы</h2>

          <div className="mt-4 border rounded-xl p-4">
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
            <div className="p-4 border-b bg-gray-50 text-sm font-medium">История расходов</div>

            <div className="divide-y">
              {expenses.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Пока пусто</div>
              ) : (
                expenses.map((e) => (
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
      )}
    </div>
  );
}
