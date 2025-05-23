'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { supabasePublic as supabase } from '@/lib/supabase/public';

interface Event {
  type: string;
  date: string | null;
  description: string | null;
}

interface Customer {
  id: string;
  phone: string;
  email: string | null;
  created_at: string | null;
  important_dates: Event[];
  orders: any[];
  bonuses: { bonus_balance: number | null; level: string | null };
  bonus_history: any[];
}

interface Props {
  customer: Customer | null;
}

export default function CustomerDetailClient({ customer }: Props) {
  const [editingDates, setEditingDates] = useState(false);
  const [tempDates, setTempDates] = useState<Event[]>(customer?.important_dates || []);
  const [bonusAction, setBonusAction] = useState<'add' | 'subtract' | null>(null);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const router = useRouter();

  // Добавление нового события
  const handleAddEvent = () => {
    setTempDates([...tempDates, { type: 'День рождения', date: null, description: null }]);
  };

  // Изменение события
  const handleEventChange = (index: number, field: keyof Event, value: string) => {
    const updatedEvents = [...tempDates];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    setTempDates(updatedEvents);
  };

  // Сохранение важных дат
  const handleSaveDates = async () => {
    if (!customer) {
      toast.error('Клиент не найден');
      return;
    }
    try {
      // Удаляем существующие записи
      const { error: deleteError } = await supabase
        .from('important_dates')
        .delete()
        .eq('phone', customer.phone);

      if (deleteError) throw deleteError;

      // Фильтруем события, где заполнены обязательные поля
      const validEvents = tempDates.filter((event) => event.type && event.date);

      if (validEvents.length > 0) {
        const { error: insertError } = await supabase
          .from('important_dates')
          .insert(
            validEvents.map((event) => ({
              phone: customer.phone,
              type: event.type,
              date: event.date || null,
              description: event.description || null,
            }))
          );
        if (insertError) throw insertError;
      }

      setTempDates(validEvents);
      setEditingDates(false);
      toast.success('Даты успешно обновлены');
      // Можно перезагрузить клиента, если нужно актуализировать
    } catch (error: any) {
      toast.error('Ошибка сохранения дат: ' + error.message);
    }
  };

  // Управление бонусами
  const handleBonusAction = async () => {
    if (!customer) {
      toast.error('Клиент не найден');
      return;
    }
    if (!bonusAmount || !bonusReason) {
      toast.error('Укажите сумму и причину');
      return;
    }
    const amount = parseInt(bonusAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Сумма должна быть положительным числом');
      return;
    }
    const finalAmount = bonusAction === 'add' ? amount : -amount;
    const currentBalance = customer.bonuses.bonus_balance ?? 0;
    const newBalance = currentBalance + finalAmount;
    if (newBalance < 0) {
      toast.error('Баланс не может быть отрицательным');
      return;
    }

    try {
      // Обновляем баланс бонусов
      const { error: bonusError } = await supabase
        .from('bonuses')
        .update({ bonus_balance: newBalance })
        .eq('phone', customer.phone);
      if (bonusError) throw bonusError;

      // Добавляем запись в историю бонусов
      const { error: historyError } = await supabase
        .from('bonus_history')
        .insert({
          user_id: customer.id,
          amount: finalAmount,
          reason: bonusReason,
          created_at: new Date().toISOString(),
        });
      if (historyError) throw historyError;

      setBonusAction(null);
      setBonusAmount('');
      setBonusReason('');
      toast.success(
        bonusAction === 'add'
          ? 'Бонусы успешно начислены'
          : 'Бонусы успешно списаны'
      );
      router.refresh();
    } catch (error: any) {
      toast.error('Ошибка управления бонусами: ' + error.message);
    }
  };

  // Экспорт CSV
  const exportToCSV = () => {
    if (!customer) {
      toast.error('Клиент не найден');
      return;
    }
    const headers = [
      'Телефон',
      'Email',
      'Дата регистрации',
      'Кол-во заказов',
      'Сумма покупок',
      'Баланс бонусов',
      'Уровень бонусов',
    ];
    const customerRow = [
      customer.phone,
      customer.email || '—',
      customer.created_at
        ? format(new Date(customer.created_at), 'dd.MM.yyyy', { locale: ru })
        : '—',
      customer.orders.length,
      customer.orders.reduce((sum, order) => sum + (order.total || 0), 0),
      customer.bonuses.bonus_balance ?? 0,
      customer.bonuses.level ?? '—',
    ];
    const datesHeader = ['Тип события', 'Дата', 'Описание'];
    const datesRows = (customer.important_dates || []).map((event) => [
      event.type,
      event.date ? format(new Date(event.date), 'dd.MM.yyyy', { locale: ru }) : '—',
      event.description || '—',
    ]);
    const ordersHeader = ['Заказ ID', 'Дата заказа', 'Сумма', 'Статус', 'Способ оплаты'];
    const ordersRows = (customer.orders || []).map((order) => [
      order.id,
      order.created_at
        ? format(new Date(order.created_at), 'dd.MM.yyyy', { locale: ru })
        : '—',
      order.total,
      order.status,
      order.payment_method || '—',
    ]);
    const bonusHistoryHeader = ['Дата', 'Причина', 'Сумма'];
    const bonusHistoryRows = (customer.bonus_history || []).map((entry) => [
      entry.created_at
        ? format(new Date(entry.created_at), 'dd.MM.yyyy', { locale: ru })
        : '—',
      entry.reason,
      entry.amount,
    ]);
    const csv = [
      headers.join(','),
      customerRow.join(','),
      '',
      'Важные даты',
      datesHeader.join(','),
      ...datesRows.map((row) => row.join(',')),
      '',
      'История заказов',
      ordersHeader.join(','),
      ...ordersRows.map((row) => row.join(',')),
      '',
      'История бонусов',
      bonusHistoryHeader.join(','),
      ...bonusHistoryRows.map((row) => row.join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_${customer.phone}.csv`;
    a.click();
  };

  if (!customer) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Клиент не найден</p>
        <Link href="/admin/customers" className="text-blue-500 hover:underline">
          Назад к списку клиентов
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4 py-6 space-y-7">
      <Toaster position="top-center" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-3xl font-bold">
          Клиент: <span className="font-mono">{customer.phone}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToCSV}
            className="text-sm text-gray-500 hover:underline"
          >
            Экспорт в CSV
          </button>
          <Link
            href="/admin/customers"
            className="text-sm text-gray-500 hover:underline"
          >
            Назад к списку
          </Link>
        </div>
      </div>

      {/* Персональная информация */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-2 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Персональные данные</h2>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="font-medium">Телефон:</span> <span className="font-mono">{customer.phone}</span>
          </div>
          <div>
            <span className="font-medium">Email:</span> {customer.email || '—'}
          </div>
          <div>
            <span className="font-medium">Дата регистрации:</span>{' '}
            {customer.created_at
              ? format(new Date(customer.created_at), 'dd.MM.yyyy', { locale: ru })
              : '—'}
          </div>
        </div>
      </section>

      {/* Важные даты */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Важные даты</h2>
          {!editingDates ? (
            <button
              onClick={() => setEditingDates(true)}
              className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
            >
              <Image src="/icons/edit.svg" alt="Edit" width={16} height={16} /> Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveDates}
                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <Image src="/icons/save.svg" alt="Save" width={16} height={16} /> Сохранить
              </button>
              <button
                onClick={() => {
                  setEditingDates(false);
                  setTempDates(customer.important_dates);
                }}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Image src="/icons/times.svg" alt="Cancel" width={16} height={16} /> Отменить
              </button>
            </div>
          )}
        </div>
        {!editingDates ? (
          <div className="space-y-2 text-sm">
            {(customer.important_dates || []).length > 0 ? (
              customer.important_dates.map((event, index) => (
                <div key={index} className="flex gap-4 items-center truncate">
                  <span className="font-medium">{event.type}</span>
                  {event.description && <span className="text-gray-500">({event.description})</span>}
                  <span>
                    {event.date
                      ? format(new Date(event.date), 'dd.MM.yyyy', { locale: ru })
                      : 'Дата не указана'}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-gray-400">Даты отсутствуют</span>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            {tempDates.map((event, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium mb-1">Тип события:</label>
                  <select
                    value={event.type}
                    onChange={(e) => handleEventChange(index, 'type', e.target.value)}
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="День рождения">День рождения</option>
                    <option value="Годовщина">Годовщина</option>
                    <option value="Особенный день">Особенный день</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Дата:</label>
                  <input
                    type="date"
                    value={event.date || ''}
                    onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Описание:</label>
                  <input
                    type="text"
                    value={event.description || ''}
                    onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Описание события"
                  />
                </div>
              </div>
            ))}
            {tempDates.length < 10 && (
              <button
                type="button"
                onClick={handleAddEvent}
                className="text-sm text-blue-500 hover:underline mt-2"
              >
                + Добавить событие
              </button>
            )}
          </div>
        )}
      </section>

      {/* Бонусы */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Бонусы</h2>
        <div className="flex flex-col md:flex-row md:gap-12 gap-2 text-sm">
          <div>
            <span className="font-medium">Баланс:</span>{' '}
            <span className="font-semibold">{customer.bonuses.bonus_balance ?? 0} ₽</span>
          </div>
          <div>
            <span className="font-medium">Уровень:</span>{' '}
            <span>{customer.bonuses.level ?? '—'}</span>
          </div>
        </div>

        {/* Управление бонусами */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Управление бонусами</h3>
          {!bonusAction ? (
            <div className="flex gap-3">
              <button
                onClick={() => setBonusAction('add')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Начислить бонусы
              </button>
              <button
                onClick={() => setBonusAction('subtract')}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Списать бонусы
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block font-medium mb-1">Сумма:</label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="Введите сумму"
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Причина:</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="Укажите причину"
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBonusAction}
                  className={`${
                    bonusAction === 'add' ? 'bg-green-500' : 'bg-red-500'
                  } text-white px-4 py-2 rounded-lg hover:${
                    bonusAction === 'add' ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  {bonusAction === 'add' ? 'Начислить' : 'Списать'}
                </button>
                <button
                  onClick={() => {
                    setBonusAction(null);
                    setBonusAmount('');
                    setBonusReason('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Отменить
                </button>
              </div>
            </div>
          )}
        </div>

        {/* История бонусов */}
        {customer.bonus_history.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6 mb-3">История бонусов</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Дата</th>
                    <th className="p-3 text-left">Причина</th>
                    <th className="p-3 text-left">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.bonus_history.map((entry, idx) => (
                    <tr
                      key={idx}
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        {entry.created_at
                          ? format(new Date(entry.created_at), 'dd.MM.yyyy', { locale: ru })
                          : '—'}
                      </td>
                      <td className="p-3">{entry.reason}</td>
                      <td
                        className={`p-3 font-medium ${
                          entry.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {entry.amount > 0 ? `+${entry.amount}` : entry.amount} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* История заказов */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">История заказов</h2>
        {customer.orders.length > 0 ? (
          <div className="space-y-6">
            {customer.orders.map((order) => (
              <div key={order.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium">
                    Заказ #{order.id} от{' '}
                    {order.created_at
                      ? format(new Date(order.created_at), 'dd.MM.yyyy', { locale: ru })
                      : '—'}
                  </p>
                  <p
                    className={`text-sm ${
                      order.status === 'Доставлен' ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  {(order.order_items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.products?.title || 'Товар'} (x{item.quantity})
                      </span>
                      <span>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                    </div>
                  ))}
                  <p className="text-right font-medium">
                    Итого: {order.total?.toLocaleString('ru-RU')} ₽
                  </p>
                  {order.bonuses_used && order.bonuses_used > 0 && (
                    <p className="text-right text-gray-500">
                      Использовано бонусов: {order.bonuses_used} ₽
                    </p>
                  )}
                  <p className="text-gray-500">
                    Способ оплаты: {order.payment_method || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Заказы отсутствуют</p>
        )}
      </section>
    </div>
  );
}
