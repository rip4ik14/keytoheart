// ✅ Путь: app/admin/(protected)/orders/OrdersTableClient.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle, Trash2, Info, X as CloseIcon, ExternalLink } from 'lucide-react';

export interface Order {
  id: string;
  order_number: number | null;

  created_at: string | null;

  phone: string | null;
  name: string | null;
  contact_name: string | null;

  recipient: string | null;
  recipient_phone: string | null;

  address: string | null;
  delivery_method: string | null;
  delivery_date: string | null;
  delivery_time: string | null;

  payment_method: string | null;

  total: number | null;

  bonuses_used: number | null;
  bonus: number | null;

  anonymous: boolean | null;
  whatsapp: boolean | null;

  delivery_instructions: string | null;
  postcard_text: string | null;

  promo_discount: number | null;
  promo_code: string | null;

  status: string | null;

  items: Array<{ id: string; title: string; price: number; quantity: number; isUpsell?: boolean; category?: string }>;
  upsell_details: Array<{ id: string; title: string; price: number; quantity: number; category?: string }>;
}

interface Props {
  initialOrders: Order[];
  loadError: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-800',
  processing: 'bg-yellow-100 text-yellow-900',
  delivering: 'bg-blue-100 text-blue-900',
  delivered: 'bg-green-100 text-green-900',
  canceled: 'bg-red-100 text-red-900',
};

const statusOptions = [
  { value: 'pending', label: 'Ожидает подтверждения' },
  { value: 'processing', label: 'В сборке' },
  { value: 'delivering', label: 'Доставляется' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'canceled', label: 'Отменён' },
] as const;

function money(n: number | null | undefined) {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return v.toLocaleString('ru-RU');
}

function safeLower(v: string | null | undefined) {
  return (v || '').toLowerCase();
}

type StatusMenuState = {
  orderId: string;
  anchorRect: DOMRect;
};

export default function OrdersTableClient({ initialOrders, loadError }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error] = useState<string | null>(loadError);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // 👇 вместо inline absolute-меню внутри таблицы используем портал
  const [statusMenu, setStatusMenu] = useState<StatusMenuState | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ id: string; label: string } | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  const router = useRouter();

  const updateStatus = async (id: string, newStatus: (typeof statusOptions)[number]['value']) => {
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId: id, status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Ошибка обновления статуса');

      setOrders((prev) => prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
      toast.success(`Статус обновлён: ${statusOptions.find((s) => s.value === newStatus)?.label}`);
    } catch (e: any) {
      toast.error(e.message);
      if (/Unauthorized/i.test(e.message)) router.push('/admin/login');
    } finally {
      setStatusMenu(null);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const res = await fetch('/api/admin/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Ошибка удаления');

      setOrders((prev) => prev.filter((x) => x.id !== id));
      toast.success('Заказ удалён');
      setDeleteModal(null);
      if (detailsOrder?.id === id) setDetailsOrder(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const visibleOrders = useMemo(() => {
    return orders.filter((o) => {
      let ok = true;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        ok = [
          o.phone,
          o.name,
          o.contact_name,
          o.recipient,
          o.recipient_phone,
          o.address,
          o.order_number ? String(o.order_number) : '',
        ].some((f) => safeLower(f).includes(q));
      }

      if (ok && statusFilter) ok = o.status === statusFilter;

      if (ok && dateFrom) ok = !!o.created_at && new Date(o.created_at) >= new Date(dateFrom);
      if (ok && dateTo) ok = !!o.created_at && new Date(o.created_at) <= new Date(dateTo + 'T23:59:59');

      return ok;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано!');
  };

  // Drag-to-scroll для десктоп-таблицы
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

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

  // refs на кнопки статуса (чтобы корректно снять DOMRect)
  const statusBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openStatusMenu = (orderId: string) => {
    const btn = statusBtnRefs.current[orderId];
    if (!btn) return;

    const rect = btn.getBoundingClientRect();

    // toggle
    setStatusMenu((prev) => (prev?.orderId === orderId ? null : { orderId, anchorRect: rect }));
  };

  // закрытие по клику вне и ESC
  useEffect(() => {
    if (!statusMenu) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatusMenu(null);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // если клик по кнопке статуса - не закрываем тут (toggle уже обработан)
      const btn = statusBtnRefs.current[statusMenu.orderId];
      if (btn && (btn === target || btn.contains(target))) return;

      // если клик внутри меню - не закрываем
      const menuEl = document.getElementById('orders-status-menu-portal');
      if (menuEl && menuEl.contains(target)) return;

      setStatusMenu(null);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [statusMenu]);

  // перепозиционирование при скролле/ресайзе (иначе меню “отлипает”)
  useEffect(() => {
    if (!statusMenu) return;

    const updateRect = () => {
      const btn = statusBtnRefs.current[statusMenu.orderId];
      if (!btn) return setStatusMenu(null);
      const rect = btn.getBoundingClientRect();
      setStatusMenu((prev) => (prev ? { ...prev, anchorRect: rect } : prev));
    };

    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [statusMenu]);

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-xl m-4">{error}</div>;
  }

  // Рендер портального меню статуса (не режется overflow'ами)
  const statusMenuPortal =
    statusMenu && typeof document !== 'undefined'
      ? createPortal(() => {
          const w = 192; // w-48
          const gap = 8;
          const pad = 8;

          const viewportW = window.innerWidth;
          const viewportH = window.innerHeight;

          // базовая позиция "под кнопкой"
          let left = statusMenu.anchorRect.left;
          let top = statusMenu.anchorRect.bottom + gap;

          // clamp по ширине
          if (left + w + pad > viewportW) left = Math.max(pad, viewportW - w - pad);
          if (left < pad) left = pad;

          // если вниз не помещается - открываем вверх
          const menuH = 6 * 40 + 10; // грубая оценка (5 статусов + отмена)
          if (top + menuH + pad > viewportH) {
            top = Math.max(pad, statusMenu.anchorRect.top - gap - menuH);
          }

          return (
            <AnimatePresence>
              <motion.div
                id="orders-status-menu-portal"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                style={{ position: 'fixed', left, top, width: w, zIndex: 90 }}
                className="bg-white border rounded-xl shadow-lg py-2"
              >
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateStatus(statusMenu.orderId, s.value)}
                    className={`block w-full text-left px-3 py-2 text-sm ${
                      orders.find((x) => x.id === statusMenu.orderId)?.status === s.value
                        ? 'bg-gray-100 font-semibold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => setStatusMenu(null)}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-black"
                >
                  Отмена
                </button>
              </motion.div>
            </AnimatePresence>
          );
        }, document.body)
      : null;

  return (
    <div className="min-h-screen w-full">
      {/* Шапка + фильтры */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Заказы</h1>
            <div className="text-xs text-gray-500">
              Найдено: <span className="font-semibold text-gray-900">{visibleOrders.length}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[180px_1fr_280px] gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">Статус</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white"
              >
                <option value="">Все</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">Поиск (№, имя, телефон, адрес)</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Например: 124, +7..., Краснодар, Анна"
                className="w-full p-2 border rounded-lg bg-white"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block mb-1 text-xs font-semibold text-gray-700">От</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-xs font-semibold text-gray-700">До</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!visibleOrders.length ? (
        <div className="p-4 bg-white text-gray-600 rounded-xl m-4 border">Заказы не найдены</div>
      ) : (
        <>
          {/* Десктоп-таблица */}
          <div ref={scrollRef} className="hidden lg:block overflow-x-auto cursor-grab px-4 sm:px-6 py-6">
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
              <table className="min-w-[1100px] w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-[11px]">
                    <th className="p-3 border-b text-left">№</th>
                    <th className="p-3 border-b text-left">Дата</th>
                    <th className="p-3 border-b text-left">Клиент</th>
                    <th className="p-3 border-b text-left">Телефон</th>
                    <th className="p-3 border-b text-left">Доставка</th>
                    <th className="p-3 border-b text-left">Адрес</th>
                    <th className="p-3 border-b text-left">Сумма</th>
                    <th className="p-3 border-b text-left">Статус</th>
                    <th className="p-3 border-b text-left">Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleOrders.map((o, i) => {
                    const labelClient = o.contact_name || o.name || '-';
                    const when = o.created_at ? format(new Date(o.created_at), 'dd.MM.yyyy HH:mm', { locale: ru }) : '-';
                    const deliveryText = o.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка';
                    const dateTime = o.delivery_date && o.delivery_time ? `${o.delivery_date} ${o.delivery_time}` : '-';

                    return (
                      <motion.tr
                        key={o.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: i * 0.015 }}
                        className={i % 2 === 0 ? '' : 'bg-gray-50'}
                      >
                        <td className="p-3 border-b font-semibold">
                          {o.order_number ? `#${o.order_number}` : `#${i + 1}`}
                        </td>
                        <td className="p-3 border-b whitespace-nowrap">{when}</td>
                        <td className="p-3 border-b">{labelClient}</td>

                        <td className="p-3 border-b">
                          <div className="flex items-center gap-2">
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

                        <td className="p-3 border-b whitespace-nowrap">
                          {deliveryText}
                          <div className="text-xs text-gray-500">{dateTime}</div>
                        </td>

                        <td className="p-3 border-b max-w-[420px]">
                          <div className="line-clamp-2 break-words">{o.address || '-'}</div>
                        </td>

                        <td className="p-3 border-b font-semibold whitespace-nowrap">{money(o.total)} ₽</td>

                        <td className="p-3 border-b">
                          <div className="relative inline-block">
                            <button
                              ref={(el) => {
                                statusBtnRefs.current[o.id] = el;
                              }}
                              onClick={() => openStatusMenu(o.id)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                statusColors[o.status ?? 'pending'] || statusColors.pending
                              }`}
                            >
                              {statusOptions.find((s) => s.value === o.status)?.label || 'Ожидает подтверждения'}
                            </button>
                          </div>
                        </td>

                        <td className="p-3 border-b">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setDetailsOrder(o)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold hover:bg-gray-50"
                            >
                              <ExternalLink size={14} /> Подробнее
                            </button>

                            <button
                              onClick={() => setDeleteModal({ id: o.id, label: o.order_number ? `#${o.order_number}` : o.id })}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                            >
                              <Trash2 size={14} /> Удалить
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Мобильная версия */}
          <div className="lg:hidden px-4 py-4 space-y-3">
            {visibleOrders.map((o, i) => {
              const labelClient = o.contact_name || o.name || '-';
              const when = o.created_at ? format(new Date(o.created_at), 'dd.MM.yyyy HH:mm', { locale: ru }) : '-';
              const deliveryText = o.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка';
              const dateTime = o.delivery_date && o.delivery_time ? `${o.delivery_date} ${o.delivery_time}` : '-';

              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.01 }}
                  className="bg-white rounded-2xl border shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {o.order_number ? `Заказ #${o.order_number}` : `Заказ ${i + 1}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{when}</div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        statusColors[o.status ?? 'pending'] || statusColors.pending
                      }`}
                    >
                      {statusOptions.find((s) => s.value === o.status)?.label || 'Ожидает подтверждения'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Клиент:</span> <span className="font-semibold">{labelClient}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Телефон:</span> <span className="font-semibold">{o.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Доставка:</span>{' '}
                      <span className="font-semibold">{deliveryText}</span> <span className="text-gray-500">({dateTime})</span>
                    </div>
                    <div className="break-words">
                      <span className="text-gray-500">Адрес:</span> <span className="font-semibold">{o.address || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Сумма:</span> <span className="font-semibold">{money(o.total)} ₽</span>
                    </div>
                  </div>

                  {o.phone && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => window.open(`tel:${o.phone}`)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs border rounded-full"
                      >
                        <Phone size={14} /> Позвонить
                      </button>

                      {o.whatsapp && (
                        <a
                          href={`https://wa.me/${o.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs border rounded-full"
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                      )}

                      <button
                        onClick={() => copyToClipboard(o.phone!)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs border rounded-full"
                      >
                        <Info size={14} /> Скопировать
                      </button>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDetailsOrder(o)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold border rounded-xl bg-white"
                    >
                      <ExternalLink size={14} /> Подробнее
                    </button>

                    <button
                      onClick={() => setDeleteModal({ id: o.id, label: o.order_number ? `#${o.order_number}` : o.id })}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold border border-red-200 text-red-700 rounded-xl bg-white"
                    >
                      <Trash2 size={14} /> Удалить
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">Статус заказа</label>
                    <select
                      value={o.status ?? 'pending'}
                      onChange={(e) => updateStatus(o.id, e.target.value as (typeof statusOptions)[number]['value'])}
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-gray-50"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* 👇 ПОРТАЛЬНОЕ МЕНЮ СТАТУСА - НЕ ОБРЕЗАЕТСЯ */}
      {statusMenuPortal}

      {/* Полноэкранная модалка "Подробнее" */}
      <AnimatePresence>
        {detailsOrder && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 flex items-stretch justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailsOrder(null)}
          >
            <motion.div
              className="w-full h-full bg-white overflow-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-white border-b">
                <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">
                      {detailsOrder.order_number ? `Заказ #${detailsOrder.order_number}` : 'Заказ'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {detailsOrder.created_at
                        ? format(new Date(detailsOrder.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
                        : '-'}
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailsOrder(null)}
                    className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-gray-50"
                    aria-label="Закрыть"
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-6 space-y-6">
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Клиент</div>
                    <div className="text-sm">
                      <div>
                        <span className="text-gray-500">Имя:</span>{' '}
                        <span className="font-semibold">{detailsOrder.contact_name || detailsOrder.name || '-'}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-gray-500">Телефон:</span>
                        <span className="font-semibold">{detailsOrder.phone || '-'}</span>
                        {detailsOrder.phone && (
                          <>
                            <button
                              onClick={() => window.open(`tel:${detailsOrder.phone}`)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Phone size={16} />
                            </button>
                            <button
                              onClick={() => copyToClipboard(detailsOrder.phone!)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Info size={16} />
                            </button>
                          </>
                        )}
                        {detailsOrder.whatsapp && detailsOrder.phone && (
                          <a
                            href={`https://wa.me/${detailsOrder.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800"
                            title="WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500">WhatsApp связь:</span>{' '}
                        <span className="font-semibold">{detailsOrder.whatsapp ? 'Да' : 'Нет'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Получатель</div>
                    <div className="text-sm">
                      <div>
                        <span className="text-gray-500">Имя:</span>{' '}
                        <span className="font-semibold">{detailsOrder.recipient || '-'}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-gray-500">Телефон:</span>{' '}
                        <span className="font-semibold">{detailsOrder.recipient_phone || '-'}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500">Анонимный заказ:</span>{' '}
                        <span className="font-semibold">{detailsOrder.anonymous ? 'Да' : 'Нет'}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Доставка и оплата</div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div>
                        <span className="text-gray-500">Способ:</span>{' '}
                        <span className="font-semibold">
                          {detailsOrder.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-gray-500">Дата/время:</span>{' '}
                        <span className="font-semibold">
                          {detailsOrder.delivery_date && detailsOrder.delivery_time
                            ? `${detailsOrder.delivery_date} ${detailsOrder.delivery_time}`
                            : '-'}
                        </span>
                      </div>
                      <div className="mt-1 break-words">
                        <span className="text-gray-500">Адрес:</span>{' '}
                        <span className="font-semibold">{detailsOrder.address || '-'}</span>
                      </div>
                    </div>

                    <div>
                      <div>
                        <span className="text-gray-500">Оплата:</span>{' '}
                        <span className="font-semibold">{detailsOrder.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-gray-500">Сумма:</span>{' '}
                        <span className="font-semibold">{money(detailsOrder.total)} ₽</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-gray-500">Бонусы списано:</span>{' '}
                        <span className="font-semibold">{money(detailsOrder.bonuses_used)} </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-gray-500">Бонусы начислено:</span>{' '}
                        <span className="font-semibold">{money(detailsOrder.bonus)} </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-gray-500">Промо:</span>{' '}
                        <span className="font-semibold">
                          {detailsOrder.promo_discount && detailsOrder.promo_discount > 0
                            ? `скидка ${money(detailsOrder.promo_discount)} ₽`
                            : 'не применён'}
                        </span>
                        {detailsOrder.promo_code ? <span className="text-gray-500"> (код: {detailsOrder.promo_code})</span> : null}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Пожелания (delivery_instructions)</div>
                    <div className="text-sm whitespace-pre-wrap break-words">{detailsOrder.delivery_instructions || '-'}</div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Текст открытки (postcard_text)</div>
                    <div className="text-sm whitespace-pre-wrap break-words">{detailsOrder.postcard_text || '-'}</div>
                  </div>
                </section>

                <section className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Состав заказа</div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Основные товары</div>
                      {detailsOrder.items?.length ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {detailsOrder.items.map((it, idx) => (
                            <li key={idx} className="flex items-start justify-between gap-3">
                              <div className="break-words">
                                {it.title} <span className="text-gray-500">x{it.quantity}</span>
                              </div>
                              <div className="font-semibold whitespace-nowrap">{money(it.price * it.quantity)} ₽</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-2 text-sm text-gray-500">-</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-gray-900">Дополнения</div>
                      {detailsOrder.upsell_details?.length ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {detailsOrder.upsell_details.map((it, idx) => (
                            <li key={idx} className="flex items-start justify-between gap-3">
                              <div className="break-words">
                                {it.title}
                                {it.category ? <span className="text-gray-500"> ({it.category})</span> : null}
                                <span className="text-gray-500"> x{it.quantity}</span>
                              </div>
                              <div className="font-semibold whitespace-nowrap">{money(it.price * it.quantity)} ₽</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-2 text-sm text-gray-500">-</div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Быстрые действия</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setDeleteModal({
                          id: detailsOrder.id,
                          label: detailsOrder.order_number ? `#${detailsOrder.order_number}` : detailsOrder.id,
                        })
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-red-700 font-semibold text-sm hover:bg-red-50"
                    >
                      <Trash2 size={16} /> Удалить заказ
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка удаления */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModal(null)}
          >
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <CloseIcon size={22} className="text-red-500 mr-2" />
                <h2 className="text-lg font-bold">Удалить заказ?</h2>
              </div>

              <p className="mb-6 text-sm text-gray-700">
                Заказ <strong>{deleteModal.label}</strong>.
                <br />
                Это действие нельзя отменить.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold"
                >
                  Отмена
                </button>
                <button
                  onClick={() => deleteOrder(deleteModal.id)}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold"
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
