'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { supabasePublic } from '@/lib/supabase/public';

interface Event {
  type: string;
  date: string | null;
  description: string | null;
}

interface OrderItem {
  quantity: number;
  price: number;
  products: { title: string; cover_url: string | null };
}

interface Order {
  id: string;
  created_at: string | null;
  total: number;
  bonuses_used: number;
  payment_method: string;
  status: string;
  order_items: OrderItem[];
}

interface Props {
  customer: {
    id: string;
    phone: string;
    email: string | null;
    created_at: string | null;
    important_dates: Event[];
    orders: Order[];
    bonuses: { bonus_balance: number | null; level: string | null };
    bonus_history: { amount: number; reason: string; created_at: string }[];
  } | null;
}

// Маппинг уровней для отображения в UI
const levelDisplayMap: Record<string, { name: string; discount: string }> = {
  bronze: { name: 'Бронзовый', discount: '2.5%' },
  silver: { name: 'Серебряный', discount: '5%' },
  gold: { name: 'Золотой', discount: '7.5%' },
  platinum: { name: 'Платиновый', discount: '10%' },
  premium: { name: 'Премиум', discount: '15%' },
};

// Список всех уровней для выпадающего списка
const levelOptions = [
  { value: 'bronze', label: 'Бронзовый (2.5%)' },
  { value: 'silver', label: 'Серебряный (5%)' },
  { value: 'gold', label: 'Золотой (7.5%)' },
  { value: 'platinum', label: 'Платиновый (10%)' },
  { value: 'premium', label: 'Премиум (15%)' },
];

export default function CustomerDetailClient({ customer }: Props) {
  const [editingDates, setEditingDates] = useState(false);
  const [tempDates, setTempDates] = useState<Event[]>(customer?.important_dates || []);
  const [bonusAction, setBonusAction] = useState<'add' | 'subtract' | null>(null);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [editingLevel, setEditingLevel] = useState(false);
  const [tempLevel, setTempLevel] = useState(customer?.bonuses.level || 'bronze');
  const router = useRouter();

  // Добавление нового события
  const handleAddEvent = () => {
    setTempDates((prev) => [
      ...prev,
      { type: 'День рождения', date: null, description: null },
    ]);
  };

  // Изменение события
  const handleEventChange = (
    index: number,
    field: keyof Event,
    value: string
  ) => {
    setTempDates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Сохранение важных дат
  const handleSaveDates = async () => {
    if (!customer) {
      toast.error('Клиент не найден');
      return;
    }

    const sb = supabasePublic as any;

    try {
      const { error: delErr } = await sb
        .from('important_dates')
        .delete()
        .eq('phone', customer.phone);
      if (delErr) throw delErr;

      const valid = tempDates.filter(
        (e) => e.type.trim() !== '' && e.date
      );
      if (valid.length > 0) {
        const { error: insErr } = await sb
          .from('important_dates')
          .insert(
            valid.map((e) => ({
              phone: customer.phone,
              type: e.type,
              date: e.date,
              description: e.description,
            }))
          );
        if (insErr) throw insErr;
      }

      setEditingDates(false);
      toast.success('Даты успешно обновлены');
      router.refresh();
    } catch (err: any) {
      toast.error('Не удалось сохранить: ' + err.message);
    }
  };

  // Управление бонусами
  const handleBonusAction = async () => {
    if (!customer) {
      toast.error('Клиент не найден');
      return;
    }

    if (!customer.phone || !customer.id) {
      toast.error('Недостаточно данных о клиенте');
      return;
    }

    const amt = parseInt(bonusAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Сумма должна быть > 0');
      return;
    }

    if (!bonusReason.trim()) {
      toast.error('Укажите причину');
      return;
    }

    const delta = bonusAction === 'add' ? amt : -amt;
    const newBal = (customer.bonuses.bonus_balance || 0) + delta;
    if (newBal < 0) {
      toast.error('Баланс не может быть отрицательным');
      return;
    }

    try {
      process.env.NODE_ENV !== "production" && console.log('Sending bonus update request:', {
        phone: customer.phone,
        delta,
        reason: bonusReason,
        user_id: customer.id,
      });

      const response = await fetch('/api/admin/bonuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: customer.phone,
          delta,
          reason: bonusReason,
          user_id: customer.id,
        }),
      });

      const result = await response.json();
      process.env.NODE_ENV !== "production" && console.log('Bonus update response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update bonuses');
      }

      toast.success(bonusAction === 'add' ? 'Начислено' : 'Списано');
      setBonusAction(null);
      setBonusAmount('');
      setBonusReason('');
      router.refresh();
    } catch (err: any) {
      process.env.NODE_ENV !== "production" && console.error('Error updating bonuses:', err);
      toast.error(err.message);
    }
  };

  // Управление уровнем клиента
  const handleLevelChange = async () => {
    if (!customer) return;

    try {
      const response = await fetch('/api/admin/update-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: customer.phone,
          level: tempLevel,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update customer level');
      }

      toast.success('Уровень клиента обновлён');
      setEditingLevel(false);
      router.refresh();
    } catch (err: any) {
      toast.error('Не удалось обновить уровень: ' + err.message);
    }
  };

  if (!customer) {
    return (
      <div className="text-center p-10">
        <p>Клиент не найден</p>
        <Link href="/admin/customers">Назад</Link>
      </div>
    );
  }

  const currentLevel = customer.bonuses.level || 'bronze';
  const levelDisplay = levelDisplayMap[currentLevel] || levelDisplayMap.bronze;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Toaster position="top-center" />

      {/* Важные даты */}
      <section className="border p-4 rounded">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">Важные даты</h2>
          {!editingDates ? (
            <button onClick={() => setEditingDates(true)}>
              Редактировать
            </button>
          ) : (
            <>
              <button onClick={handleSaveDates}>Сохранить</button>
              <button
                onClick={() => {
                  setEditingDates(false);
                  setTempDates(customer.important_dates);
                }}
              >
                Отменить
              </button>
            </>
          )}
        </div>
        {!editingDates ? (
          customer.important_dates.map((e, i) => (
            <div key={i}>
              <strong>{e.type}</strong> —{' '}
              {e.date
                ? format(new Date(e.date), 'dd.MM.yyyy', { locale: ru })
                : '—'}
              {e.description && ` (${e.description})`}
            </div>
          ))
        ) : (
          tempDates.map((e, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={e.type}
                onChange={(ev) =>
                  handleEventChange(i, 'type', ev.target.value)
                }
                className="border p-1"
              />
              <input
                type="date"
                value={e.date || ''}
                onChange={(ev) =>
                  handleEventChange(i, 'date', ev.target.value)
                }
                className="border p-1"
              />
              <input
                value={e.description || ''}
                onChange={(ev) =>
                  handleEventChange(i, 'description', ev.target.value)
                }
                className="border p-1"
                placeholder="Описание"
              />
            </div>
          ))
        )}
        {editingDates && (
          <button onClick={handleAddEvent}>+ Добавить дату</button>
        )}
      </section>

      {/* Бонусы и уровень */}
      <section className="border p-4 rounded space-y-2">
        <h2 className="text-xl">Бонусы и уровень</h2>
        <div>Баланс: {customer.bonuses.bonus_balance} ₽</div>
        <div className="flex items-center gap-2">
          <span>Уровень:</span>
          {!editingLevel ? (
            <>
              <span>{levelDisplay.name} ({levelDisplay.discount})</span>
              <button onClick={() => setEditingLevel(true)}>Изменить</button>
            </>
          ) : (
            <>
              <select
                value={tempLevel}
                onChange={(e) => setTempLevel(e.target.value)}
                className="border p-1 rounded"
              >
                {levelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button onClick={handleLevelChange}>Сохранить</button>
              <button
                onClick={() => {
                  setEditingLevel(false);
                  setTempLevel(customer.bonuses.level || 'bronze');
                }}
              >
                Отменить
              </button>
            </>
          )}
        </div>

        {!bonusAction ? (
          <div className="flex gap-2">
            <button onClick={() => setBonusAction('add')}>Начислить</button>
            <button onClick={() => setBonusAction('subtract')}>
              Списать
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={bonusAmount}
              onChange={(ev) => setBonusAmount(ev.target.value)}
              type="number"
              placeholder="Сумма"
              className="border p-1"
            />
            <input
              value={bonusReason}
              onChange={(ev) => setBonusReason(ev.target.value)}
              placeholder="Причина (обязательно)"
              className="border p-1"
            />
            <button onClick={handleBonusAction}>ОК</button>
            <button onClick={() => setBonusAction(null)}>×</button>
          </div>
        )}
      </section>

      {/* Заказы */}
      <section className="border p-4 rounded space-y-4">
        <h2 className="text-xl">История заказов</h2>
        {customer.orders.length === 0 && <p>Нет заказов</p>}
        {customer.orders.map((ord: Order) => (
          <div key={ord.id} className="border-t pt-2">
            <div>
              Заказ #{ord.id} от{' '}
              {ord.created_at
                ? format(new Date(ord.created_at), 'dd.MM.yyyy HH:mm', {
                    locale: ru,
                  })
                : '—'}
            </div>
            <div>Сумма: {ord.total} ₽</div>
            <div>Статус: {ord.status}</div>
            <div>
              Товары:
              {ord.order_items.map((it: OrderItem, idx: number) => (
                <div key={idx} className="ml-4">
                  {it.products.title} ×{it.quantity} — {it.price} ₽
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}