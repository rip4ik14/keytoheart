'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

type Event = {
  type: string;
  date: string | null;
  description: string | null;
};

type OrderItem = {
  quantity: number;
  price: number;
  product_id: number | null;
  products: { title: string; image_url: string | null } | null;
};

type Order = {
  id: string;
  created_at: string | null;
  total: number;
  bonuses_used: number;
  payment_method: string | null;
  status: string | null;
  order_items: OrderItem[];
};

type BonusHistoryEntry = {
  amount: number;
  reason: string | null;
  created_at: string | null;
};

type Customer = {
  id: string;
  phone: string;
  email: string | null;
  created_at: string | null;
  important_dates: Event[];
  orders: Order[];
  bonuses: { bonus_balance: number | null; level: string | null };
  bonus_history: BonusHistoryEntry[];
  is_registered?: boolean;
};

type Props = { customer: Customer | null };

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

function fmtDate(d: string | null, withTime = false) {
  if (!d) return '—';
  try {
    return format(new Date(d), withTime ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy', { locale: ru });
  } catch {
    return '—';
  }
}

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString('ru-RU') + ' ₽';
}

function normalizeLevelUi(levelRaw: string | null | undefined) {
  const v = (levelRaw || '').trim().toLowerCase();
  if (v.includes('сереб')) return { code: 'silver', label: 'Серебряный', discount: '5%' };
  if (v.includes('золот')) return { code: 'gold', label: 'Золотой', discount: '7.5%' };
  if (v.includes('платин')) return { code: 'platinum', label: 'Платиновый', discount: '10%' };
  if (v.includes('преми')) return { code: 'premium', label: 'Премиум', discount: '15%' };
  return { code: 'bronze', label: 'Бронзовый', discount: '2.5%' };
}

const LEVEL_OPTIONS = [
  { value: 'Бронзовый', label: 'Бронзовый (2.5%)' },
  { value: 'Серебряный', label: 'Серебряный (5%)' },
  { value: 'Золотой', label: 'Золотой (7.5%)' },
  { value: 'Платиновый', label: 'Платиновый (10%)' },
  { value: 'Премиум', label: 'Премиум (15%)' },
];

export default function CustomerDetailClient({ customer }: Props) {
  const router = useRouter();

  const [editingDates, setEditingDates] = useState(false);
  const [tempDates, setTempDates] = useState<Event[]>(customer?.important_dates || []);

  const [bonusMode, setBonusMode] = useState<'add' | 'subtract' | null>(null);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');

  const [editingLevel, setEditingLevel] = useState(false);
  const [tempLevel, setTempLevel] = useState<string>(customer?.bonuses.level || 'Бронзовый');

  const [busy, setBusy] = useState(false);

  const isGuest = Boolean(customer?.id?.startsWith('guest:'));
  const balance = customer?.bonuses.bonus_balance ?? 0;

  const stats = useMemo(() => {
    const orders = customer?.orders || [];
    const count = orders.length;
    const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalUsed = orders.reduce((s, o) => s + (o.bonuses_used || 0), 0);
    return { count, totalSpent, totalUsed };
  }, [customer]);

  const levelUi = normalizeLevelUi(customer?.bonuses.level);

  // --- dates ---
  const addEvent = () => {
    setTempDates((p) => [...p, { type: 'День рождения', date: null, description: null }]);
  };

  const changeEvent = (idx: number, key: keyof Event, value: string) => {
    setTempDates((p) => {
      const copy = [...p];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });
  };

  const removeEvent = (idx: number) => {
    setTempDates((p) => p.filter((_, i) => i !== idx));
  };

  const saveDates = async () => {
    if (!customer) return;
    setBusy(true);
    try {
      const valid = tempDates
        .map((e) => ({
          type: (e.type || '').trim(),
          date: e.date || null,
          description: (e.description || '').trim() || null,
        }))
        .filter((e) => e.type && e.date);

      const res = await fetch('/api/admin/important-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone, dates: valid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось сохранить даты');

      toast.success('Даты обновлены');
      setEditingDates(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  // --- bonuses ---
  const applyBonus = async () => {
    if (!customer) return;

    const amt = Math.floor(Number(bonusAmount));
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Сумма должна быть > 0');
      return;
    }
    if (!bonusReason.trim()) {
      toast.error('Укажи причину');
      return;
    }

    const delta = bonusMode === 'add' ? amt : -amt;
    if (balance + delta < 0) {
      toast.error('Баланс не может быть отрицательным');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: customer.phone,
          delta,
          reason: bonusReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось обновить бонусы');

      toast.success(delta > 0 ? 'Бонусы начислены' : 'Бонусы списаны');
      setBonusMode(null);
      setBonusAmount('');
      setBonusReason('');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  // --- level ---
  const saveLevel = async () => {
    if (!customer) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/update-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone, level: tempLevel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось обновить уровень');

      toast.success('Уровень обновлён');
      setEditingLevel(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Toaster position="top-center" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="text-lg font-semibold">Клиент не найден</div>
          <button
            className="mt-4 rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
            onClick={() => router.push('/admin/customers')}
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-2xl font-semibold">Клиент</div>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              <div>
                Телефон: <span className="font-mono text-gray-900">{customer.phone}</span>
              </div>
              <div>Email: <span className="text-gray-900">{customer.email || '—'}</span></div>
              <div>
                Профиль: <span className="text-gray-900">{isGuest ? 'гость' : 'профиль'}</span>
                <span className="text-gray-400"> (id: {customer.id})</span>
              </div>
              <div>Дата: <span className="text-gray-900">{fmtDate(customer.created_at)}</span></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
              onClick={() => router.push('/admin/customers')}
            >
              Назад
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Заказов</div>
            <div className="text-lg font-semibold">{stats.count}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Сумма покупок</div>
            <div className="text-lg font-semibold">{money(stats.totalSpent)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Списано бонусов</div>
            <div className="text-lg font-semibold">{money(stats.totalUsed)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Баланс</div>
            <div className="text-lg font-semibold">{money(balance)}</div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Важные даты</div>
            <div className="text-sm text-gray-500">Храним по телефону, работает и для гостей</div>
          </div>

          {!editingDates ? (
            <button
              className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
              onClick={() => setEditingDates(true)}
            >
              Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                disabled={busy}
                className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
                onClick={saveDates}
              >
                Сохранить
              </button>
              <button
                disabled={busy}
                className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
                onClick={() => {
                  setEditingDates(false);
                  setTempDates(customer.important_dates || []);
                }}
              >
                Отменить
              </button>
            </div>
          )}
        </div>

        {!editingDates ? (
          <div className="mt-4 space-y-2">
            {customer.important_dates.length === 0 ? (
              <div className="text-sm text-gray-500">—</div>
            ) : (
              customer.important_dates.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                  <div>
                    <div className="font-medium">{e.type}</div>
                    <div className="text-sm text-gray-600">
                      {fmtDate(e.date)}{e.description ? ` - ${e.description}` : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {tempDates.map((e, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_1fr_auto] sm:items-center">
                <input
                  value={e.type}
                  onChange={(ev) => changeEvent(i, 'type', ev.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2"
                  placeholder="Тип"
                />
                <input
                  type="date"
                  value={e.date || ''}
                  onChange={(ev) => changeEvent(i, 'date', ev.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2"
                />
                <input
                  value={e.description || ''}
                  onChange={(ev) => changeEvent(i, 'description', ev.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2"
                  placeholder="Описание (опционально)"
                />
                <button
                  className="rounded-xl border border-gray-300 px-3 py-2 hover:bg-gray-50"
                  onClick={() => removeEvent(i)}
                >
                  Удалить
                </button>
              </div>
            ))}

            <button
              className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
              onClick={addEvent}
            >
              + Добавить дату
            </button>
          </div>
        )}
      </div>

      {/* Bonuses + Level */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Бонусы и уровень</div>
            <div className="text-sm text-gray-500">
              Списание и начисление - через API /api/admin/bonuses. История - по телефону.
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700">
            <div>
              Баланс: <span className="font-semibold text-gray-900">{money(balance)}</span>
            </div>
            <div className="mt-1">
              Уровень:{' '}
              {!editingLevel ? (
                <span className="font-semibold text-gray-900">
                  {levelUi.label} ({levelUi.discount})
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!editingLevel ? (
              <button
                className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
                onClick={() => setEditingLevel(true)}
              >
                Изменить уровень
              </button>
            ) : (
              <>
                <select
                  value={tempLevel}
                  onChange={(e) => setTempLevel(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2"
                >
                  {LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <button
                  disabled={busy}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
                  onClick={saveLevel}
                >
                  Сохранить
                </button>
                <button
                  disabled={busy}
                  className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
                  onClick={() => {
                    setEditingLevel(false);
                    setTempLevel(customer.bonuses.level || 'Бронзовый');
                  }}
                >
                  Отменить
                </button>
              </>
            )}

            {!bonusMode ? (
              <>
                <button
                  className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
                  onClick={() => setBonusMode('add')}
                >
                  Начислить
                </button>
                <button
                  className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
                  onClick={() => setBonusMode('subtract')}
                >
                  Списать
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={bonusAmount}
                  onChange={(ev) => setBonusAmount(ev.target.value)}
                  type="number"
                  inputMode="numeric"
                  className="w-28 rounded-xl border border-gray-300 px-3 py-2"
                  placeholder="Сумма"
                />
                <input
                  value={bonusReason}
                  onChange={(ev) => setBonusReason(ev.target.value)}
                  className="min-w-[220px] flex-1 rounded-xl border border-gray-300 px-3 py-2"
                  placeholder="Причина (обязательно)"
                />
                <button
                  disabled={busy}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
                  onClick={applyBonus}
                >
                  ОК
                </button>
                <button
                  disabled={busy}
                  className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
                  onClick={() => {
                    setBonusMode(null);
                    setBonusAmount('');
                    setBonusReason('');
                  }}
                >
                  Отмена
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bonus history */}
        <div className="mt-5">
          <div className="text-sm font-semibold">История бонусов</div>
          <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200">
            {customer.bonus_history.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">—</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {customer.bonus_history.slice(0, 30).map((h, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900">{h.reason || '—'}</div>
                      <div className="mt-1 text-xs text-gray-500">{fmtDate(h.created_at, true)}</div>
                    </div>
                    <div className={cls('text-sm font-semibold', h.amount >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                      {h.amount >= 0 ? `+${h.amount}` : `${h.amount}`} ₽
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Показываю последние 30 операций
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="text-lg font-semibold">История заказов</div>
        <div className="mt-4 space-y-3">
          {customer.orders.length === 0 ? (
            <div className="text-sm text-gray-500">Нет заказов</div>
          ) : (
            customer.orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <div className="font-semibold">Заказ #{o.id}</div>
                    <div className="text-gray-600">{fmtDate(o.created_at, true)}</div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <div>Сумма: <span className="font-semibold text-gray-900">{money(o.total)}</span></div>
                    <div>Списано: <span className="font-semibold text-gray-900">{money(o.bonuses_used || 0)}</span></div>
                    <div>Статус: <span className="font-semibold text-gray-900">{o.status || '—'}</span></div>
                  </div>
                </div>

                {o.order_items?.length ? (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <div className="text-xs font-semibold text-gray-600">Товары</div>
                    <div className="mt-2 space-y-1 text-sm">
                      {o.order_items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <div className="min-w-0 truncate">
                            {it.products?.title || 'Товар'}{' '}
                            <span className="text-gray-500">x{it.quantity}</span>
                          </div>
                          <div className="shrink-0 font-medium">{money((it.price || 0) * (it.quantity || 1))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-xs text-gray-500 px-2">
        Подсказка: гость - это phone из заказов без auth.users. Регистрация - это наличие записи в auth.users.
      </div>
    </div>
  );
}
