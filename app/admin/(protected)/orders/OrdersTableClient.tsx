// ✅ Путь: app/admin/(protected)/orders/OrdersTableClient.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle, Trash2, Info, X as CloseIcon } from 'lucide-react';
import { csrfFetch } from '@/lib/api/csrfFetch';

export interface Order {
  id: string;
  created_at: string | null;
  phone: string | null;
  contact_name: string | null;
  recipient: string | null;
  recipient_phone: string | null;
  address: string | null;
  total: number | null;
  payment_method: string | null;
  status: string | null;
  delivery_method: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  anonymous: boolean | null;
  whatsapp: boolean | null;
  postcard_text: string | null;
  promo_id: string | null;
  promo_discount: number | null;
  items: Array<{ id: string; title: string; price: number; quantity: number }>;
  upsell_details: Array<{ id: string; title: string; price: number; quantity: number; category?: string }>;
}

interface Props {
  initialOrders: Order[];
  loadError: string | null;
}

// Цвета для бейджей статуса
const statusColors: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700',
  processing: 'bg-yellow-100 text-yellow-800',
  delivering: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
};

const statusOptions = [
  { value: 'pending', label: 'Ожидает подтверждения' },
  { value: 'processing', label: 'В сборке' },
  { value: 'delivering', label: 'Доставляется' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'canceled', label: 'Отменён' },
] as const;

export default function OrdersTableClient({ initialOrders, loadError }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error, setError] = useState<string | null>(loadError);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  // Проверка сессии
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin-session', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error();
      } catch {
        toast.error('Доступ запрещён');
        router.push(`/admin/login?from=${encodeURIComponent('/admin/orders')}`);
      }
    })();
  }, [router]);

  // Обновление статуса
  const updateStatus = async (id: string, newStatus: (typeof statusOptions)[number]['value']) => {
    try {
      const res = await csrfFetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Ошибка обновления статуса');
      setOrders(o => o.map(x => (x.id === id ? { ...x, status: newStatus } : x)));
      toast.success(`Заказ #${id} → ${statusOptions.find(s => s.value === newStatus)?.label}`);
    } catch (e: any) {
      toast.error(e.message);
      if (/Unauthorized/i.test(e.message)) router.push('/admin/login');
    } finally {
      setStatusMenuOpen(null);
    }
  };

  // Удаление заказа
  const deleteOrder = async (id: string) => {
    try {
      const res = await csrfFetch('/api/admin/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Ошибка удаления');
      setOrders(o => o.filter(x => x.id !== id));
      toast.success(`Заказ #${id} удалён`);
      setDeleteModal(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Поиск и фильтрация
  const visibleOrders = orders.filter(o => {
    let ok = true;

    // Поиск по имени, телефону, получателю, адресу
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      ok = [o.phone, o.contact_name, o.recipient, o.address].some(f => f?.toLowerCase().includes(q));
    }

    // Фильтр по статусу
    if (ok && statusFilter) {
      ok = o.status === statusFilter;
    }

    // Фильтр по дате
    if (ok && dateFrom) {
      ok = !!o.created_at && new Date(o.created_at) >= new Date(dateFrom);
    }
    if (ok && dateTo) {
      ok = !!o.created_at && new Date(o.created_at) <= new Date(dateTo + 'T23:59:59');
    }

    return ok;
  });

  // Копировать в буфер
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано!');
  };

  // Drag-to-scroll (для десктоп-таблицы)
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false,
      startX = 0,
      scrollLeft = 0;
    const onDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.classList.add('cursor-grabbing');
    };
    const onUp = () => {
      isDown = false;
      el.classList.remove('cursor-grabbing');
    };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('mouseleave', onUp);
    el.addEventListener('mousemove', onMove);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('mouseleave', onUp);
      el.removeEventListener('mousemove', onMove);
    };
  }, []);

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded">{error}</div>;
  }
  if (!visibleOrders.length) {
    return <div className="p-4 bg-gray-100 text-gray-600 rounded">Заказы не найдены</div>;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      {/* Фильтры */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white rounded-xl shadow">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Статус</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Все</option>
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Поиск (имя, телефон, адрес)</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Введите текст..."
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block mb-1 text-sm font-medium text-gray-700">От</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-sm font-medium text-gray-700">До</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </motion.div>

      {/* Десктоп-таблица */}
      <div
        ref={scrollRef}
        className="hidden lg:block overflow-x-auto cursor-grab bg-white rounded-xl shadow"
      >
        <table className="min-w-[1200px] w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-xs">
              <th className="p-2 border-b align-middle">№</th>
              <th className="p-2 border-b align-middle">Дата</th>
              <th className="p-2 border-b align-middle">Клиент</th>
              <th className="p-2 border-b align-middle">Телефон</th>
              <th className="p-2 border-b align-middle">Получатель</th>
              <th className="p-2 border-b align-middle">Тел. получ.</th>
              <th className="p-2 border-b align-middle">Адрес</th>
              <th className="p-2 border-b align-middle">Сумма</th>
              <th className="p-2 border-b align-middle">Оплата</th>
              <th className="p-2 border-b align-middle">Доставка</th>
              <th className="p-2 border-b align-middle">Дата/Время</th>
              <th className="p-2 border-b align-middle">Анонимно</th>
              <th className="p-2 border-b align-middle">WhatsApp</th>
              <th className="p-2 border-b align-middle">Открытка</th>
              <th className="p-2 border-b align-middle">Промо</th>
              <th className="p-2 border-b align-middle">Товары</th>
              <th className="p-2 border-b align-middle">Дополнения</th>
              <th className="p-2 border-b align-middle">Статус</th>
              <th className="p-2 border-b align-middle">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((o, i) => (
              <motion.tr
                key={o.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className={i % 2 === 0 ? '' : 'bg-gray-50'}
              >
                <td className="p-2 border-b align-middle">{i + 1}</td>
                <td className="p-2 border-b align-middle">
                  {o.created_at
                    ? format(new Date(o.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
                    : '-'}
                </td>
                <td className="p-2 border-b align-middle">{o.contact_name || '-'}</td>
                <td className="p-2 border-b align-middle">
                  <div className="flex items-center gap-1">
                    <span className="whitespace-nowrap">{o.phone || '-'}</span>
                    {o.phone && (
                      <>
                        <button
                          title="Позвонить"
                          onClick={() => window.open(`tel:${o.phone}`)}
                          className="text-blue-600 hover:text-blue-800"
                          tabIndex={-1}
                        >
                          <Phone size={16} />
                        </button>
                        <button
                          title="Скопировать"
                          onClick={() => copyToClipboard(o.phone!)}
                          className="text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          <Info size={16} />
                        </button>
                      </>
                    )}
                    {o.whatsapp && o.phone && (
                      <a
                        href={`https://wa.me/${o.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800"
                        title="WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-2 border-b align-middle">{o.recipient || '-'}</td>
                <td className="p-2 border-b align-middle">{o.recipient_phone || '-'}</td>
                <td className="p-2 border-b align-middle max-w-xs break-words">{o.address || '-'}</td>
                <td className="p-2 border-b align-middle font-semibold">
                  {o.total?.toLocaleString('ru-RU') ?? 0} ₽
                </td>
                <td className="p-2 border-b align-middle">
                  {o.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}
                </td>
                <td className="p-2 border-b align-middle">
                  {o.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}
                </td>
                <td className="p-2 border-b align-middle">
                  {o.delivery_date && o.delivery_time
                    ? `${o.delivery_date} ${o.delivery_time}`
                    : '-'}
                </td>
                <td className="p-2 border-b align-middle">{o.anonymous ? 'Да' : 'Нет'}</td>
                <td className="p-2 border-b align-middle">{o.whatsapp ? 'Да' : 'Нет'}</td>
                <td className="p-2 border-b align-middle max-w-xs break-words">
                  {o.postcard_text || '-'}
                </td>
                <td className="p-2 border-b align-middle">
                  {o.promo_id
                    ? `Применён (${o.promo_discount?.toLocaleString('ru-RU') ?? 0} ₽)`
                    : '—'}
                </td>
                <td className="p-2 border-b align-middle max-w-xs">
                  {o.items.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="whitespace-nowrap">
                          {it.title} ×{it.quantity} — {it.price * it.quantity} ₽
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-2 border-b align-middle max-w-xs">
                  {o.upsell_details.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {o.upsell_details.map((it, idx) => (
                        <li key={idx} className="whitespace-nowrap">
                          {it.title} ({it.category}) ×{it.quantity} — {it.price} ₽
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-2 border-b align-middle">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setStatusMenuOpen(o.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[o.status ?? 'pending']
                      } border`}
                    >
                      {statusOptions.find(s => s.value === o.status)?.label}
                    </button>
                    <AnimatePresence>
                      {statusMenuOpen === o.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 z-20 mt-1 w-40 bg-white border rounded shadow py-1"
                        >
                          {statusOptions.map(s => (
                            <button
                              key={s.value}
                              onClick={() => updateStatus(o.id, s.value)}
                              className={`block w-full text-left px-3 py-1 text-sm ${
                                o.status === s.value
                                  ? 'bg-gray-100 font-semibold'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                          <button
                            onClick={() => setStatusMenuOpen(null)}
                            className="block w-full text-left px-3 py-1 text-xs text-gray-400 hover:text-black"
                          >
                            Отмена
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
                <td className="p-2 border-b align-middle">
                  <button
                    onClick={() => setDeleteModal({ id: o.id, name: o.contact_name || '' })}
                    className="flex items-center gap-1 text-red-600 hover:underline"
                  >
                    <Trash2 size={16} /> Удалить
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобильная версия */}
      <div className="lg:hidden space-y-4">
        {visibleOrders.map((o, i) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.02 }}
            className="p-4 bg-white rounded-xl shadow"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">#{i + 1}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  statusColors[o.status ?? 'pending']
                }`}
              >
                {statusOptions.find(s => s.value === o.status)?.label}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <div>
                <strong>Дата:</strong>{' '}
                {o.created_at
                  ? format(new Date(o.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
                  : '-'}
              </div>
              <div>
                <strong>Клиент:</strong> {o.contact_name || '-'}
              </div>

              <div className="flex items-center gap-2">
                <strong>Телефон:</strong>
                <span>{o.phone || '-'}</span>
              </div>

              {o.phone && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <button
                    onClick={() => window.open(`tel:${o.phone}`)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-full"
                  >
                    <Phone size={14} /> Позвонить
                  </button>
                  {o.whatsapp && (
                    <a
                      href={`https://wa.me/${o.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-full"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => copyToClipboard(o.phone!)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-full"
                  >
                    <Info size={14} /> Скопировать
                  </button>
                </div>
              )}

              <div>
                <strong>Получатель:</strong> {o.recipient || '-'}
              </div>
              <div>
                <strong>Адрес:</strong> {o.address || '-'}
              </div>
              <div>
                <strong>Сумма:</strong> {o.total?.toLocaleString('ru-RU') ?? 0} ₽
              </div>
              {o.delivery_date && o.delivery_time && (
                <div>
                  <strong>Доставка:</strong> {o.delivery_date} {o.delivery_time}
                </div>
              )}

              {/* Управление статусом на мобильной версии */}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">Статус заказа</label>
                <select
                  value={o.status ?? 'pending'}
                  onChange={e =>
                    updateStatus(o.id, e.target.value as (typeof statusOptions)[number]['value'])
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                >
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setDeleteModal({ id: o.id, name: o.contact_name || '' })}
                className="mt-3 text-red-600 hover:underline flex items-center gap-1 text-sm"
              >
                <Trash2 size={16} /> Удалить
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Модалка удаления */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex items-center mb-4">
                <CloseIcon size={24} className="text-red-500 mr-2" />
                <h2 className="text-lg font-semibold">Удалить заказ?</h2>
              </div>
              <p className="mb-6">
                Заказ <strong>#{deleteModal.id}</strong> — <em>{deleteModal.name}</em>.
                <br />
                Это действие нельзя отменить.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  onClick={() => deleteOrder(deleteModal.id)}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
