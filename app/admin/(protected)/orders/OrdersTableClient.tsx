// ✅ Путь: app/admin/(protected)/orders/OrdersTableClient.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, MessageCircle, Trash2, Info, X as CloseIcon, ExternalLink, Send } from 'lucide-react';

export interface Order {
  id: string;
  order_number: number | null;

  created_at: string | null;

  phone: string | null;
  name: string | null;
  contact_name: string | null;

  recipient: string | null;
  occasion: string | null;
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

  contact_method?: string | null;

  delivery_instructions: string | null;
  postcard_text: string | null;

  promo_discount: number | null;
  promo_code: string | null;

  status: string | null;

  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    isUpsell?: boolean;
    category?: string;

    product_url?: string;
    image_url?: string | null;
  }>;

  upsell_details: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    category?: string;

    product_url?: string;
    image_url?: string | null;
  }>;
}

interface Props {
  initialOrders: Order[];
  loadError: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-900 border-gray-200',
  processing: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  delivering: 'bg-blue-50 text-blue-900 border-blue-200',
  delivered: 'bg-green-50 text-green-900 border-green-200',
  canceled: 'bg-red-50 text-red-800 border-red-200',
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

type StatusMenuState = {
  orderId: string;
  anchorRect: DOMRect;
};

const digitsOnly = (v: string) => (v || '').replace(/\D/g, '');

function normalizeContactMethod(o: Order): 'call' | 'whatsapp' | 'telegram' | 'max' {
  const raw = (o.contact_method || '').toLowerCase().trim();
  if (raw === 'whatsapp' || raw === 'telegram' || raw === 'max' || raw === 'call') return raw;
  if (o.whatsapp) return 'whatsapp';
  return 'call';
}

function contactLabel(m: 'call' | 'whatsapp' | 'telegram' | 'max') {
  if (m === 'whatsapp') return 'WhatsApp';
  if (m === 'telegram') return 'Telegram';
  if (m === 'max') return 'MAX';
  return 'Звонок';
}

export default function OrdersTableClient({ initialOrders, loadError }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error] = useState<string | null>(loadError);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [statusMenu, setStatusMenu] = useState<StatusMenuState | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ id: string; label: string } | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  const router = useRouter();

  const uiBtn =
    'inline-flex items-center justify-center gap-2 rounded-full border bg-white hover:bg-gray-50 active:bg-gray-100 transition px-3 py-1.5 text-xs font-semibold text-gray-900';
  const uiBtnIcon =
    'inline-flex items-center justify-center rounded-full border bg-white hover:bg-gray-50 active:bg-gray-100 transition h-8 w-8 text-gray-900';
  const uiBtnDanger =
    'inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white hover:bg-red-50 active:bg-red-100 transition px-3 py-1.5 text-xs font-semibold text-red-700';

  const badgeBase = 'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold';

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
    const fromMs = dateFrom ? Date.parse(`${dateFrom}T00:00:00+03:00`) : null;
    const toMs = dateTo ? Date.parse(`${dateTo}T23:59:59+03:00`) : null;

    return orders.filter((o) => {
      let ok = true;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        ok = [
          o.phone,
          o.name,
          o.contact_name,
          o.recipient,
          o.occasion,
          o.recipient_phone,
          o.address,
          o.order_number ? String(o.order_number) : '',
          o.contact_method ? String(o.contact_method) : '',
        ].some((f) => safeLower(f).includes(q));
      }

      if (ok && statusFilter) ok = o.status === statusFilter;

      if (ok && (fromMs || toMs)) {
        const createdMs = o.created_at ? Date.parse(o.created_at) : NaN;
        if (!Number.isFinite(createdMs)) return false;
        if (fromMs && createdMs < fromMs) return false;
        if (toMs && createdMs > toMs) return false;
      }

      return ok;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано!');
  };

  const openTelegramByPhone = (phone: string) => {
    const digits = digitsOnly(phone);
    if (!digits) return;
    try {
      window.open(`tg://resolve?phone=${digits}`, '_blank');
    } catch {
      copyToClipboard(phone);
    }
  };

  const openMaxByPhone = (phone: string) => {
    copyToClipboard(phone);
    toast('MAX: номер скопирован', { icon: '📋' });
  };

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

  const statusBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openStatusMenu = (orderId: string) => {
    const btn = statusBtnRefs.current[orderId];
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    setStatusMenu((prev) => (prev?.orderId === orderId ? null : { orderId, anchorRect: rect }));
  };

  useEffect(() => {
    if (!statusMenu) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatusMenu(null);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const btn = statusBtnRefs.current[statusMenu.orderId];
      if (btn && (btn === target || btn.contains(target))) return;

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

  const statusMenuPortal =
    statusMenu && typeof document !== 'undefined'
      ? createPortal(
          (() => {
            const w = 210;
            const gap = 8;
            const pad = 10;

            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;

            let left = statusMenu.anchorRect.left;
            let top = statusMenu.anchorRect.bottom + gap;

            if (left + w + pad > viewportW) left = Math.max(pad, viewportW - w - pad);
            if (left < pad) left = pad;

            const menuH = statusOptions.length * 40 + 44;
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
                  className="bg-white border rounded-2xl shadow-lg py-2 overflow-hidden"
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
                    className="block w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-gray-900"
                  >
                    Отмена
                  </button>
                </motion.div>
              </AnimatePresence>
            );
          })(),
          document.body,
        )
      : null;

  return (
    <div className="min-h-screen w-full">
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
                className="w-full px-3 py-2 border rounded-2xl bg-white text-sm"
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
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Поиск (№, имя, телефон, адрес, повод, способ связи)
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Например: 124, +7..., Краснодар, Анна, день рождения, whatsapp"
                className="w-full px-3 py-2 border rounded-2xl bg-white text-sm"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block mb-1 text-xs font-semibold text-gray-700">От</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-2xl bg-white text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-xs font-semibold text-gray-700">До</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-2xl bg-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!visibleOrders.length ? (
        <div className="p-4 bg-white text-gray-600 rounded-2xl m-4 border">Заказы не найдены</div>
      ) : (
        <>
          <div ref={scrollRef} className="hidden lg:block overflow-x-auto cursor-grab px-4 sm:px-6 py-6">
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <table className="min-w-[1180px] w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-[11px]">
                    <th className="p-3 border-b text-left">№</th>
                    <th className="p-3 border-b text-left">Дата</th>
                    <th className="p-3 border-b text-left">Клиент</th>
                    <th className="p-3 border-b text-left">Связь</th>
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
                    const when = formatMskDateTime(o.created_at);
                    const deliveryText = o.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка';
                    const dateTime = o.delivery_date && o.delivery_time ? `${o.delivery_date} ${o.delivery_time}` : '-';
                    const method = normalizeContactMethod(o);
                    const methodText = contactLabel(method);

                    return (
                      <motion.tr
                        key={o.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.18, delay: i * 0.01 }}
                        className={i % 2 === 0 ? '' : 'bg-gray-50'}
                      >
                        <td className="p-3 border-b font-semibold whitespace-nowrap">
                          {o.order_number ? `#${o.order_number}` : `#${i + 1}`}
                        </td>

                        <td className="p-3 border-b whitespace-nowrap">{when}</td>

                        <td className="p-3 border-b">{labelClient}</td>

                        <td className="p-3 border-b">
                          <span className={`${badgeBase} bg-white border-gray-200`}>{methodText}</span>
                        </td>

                        <td className="p-3 border-b">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">{o.phone || '-'}</span>

                            {o.phone && (
                              <>
                                {method === 'call' && (
                                  <button
                                    title="Позвонить"
                                    onClick={() => window.open(`tel:${o.phone}`)}
                                    className={uiBtnIcon}
                                    tabIndex={-1}
                                  >
                                    <Phone size={16} />
                                  </button>
                                )}

                                {method === 'whatsapp' && (
                                  <a
                                    href={`https://wa.me/${digitsOnly(o.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={uiBtnIcon}
                                    title="Написать в WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}

                                {method === 'telegram' && (
                                  <button
                                    title="Открыть Telegram по номеру"
                                    onClick={() => openTelegramByPhone(o.phone!)}
                                    className={uiBtnIcon}
                                    tabIndex={-1}
                                  >
                                    <Send size={16} />
                                  </button>
                                )}

                                {method === 'max' && (
                                  <button
                                    title="MAX (скопировать номер)"
                                    onClick={() => openMaxByPhone(o.phone!)}
                                    className={uiBtnIcon}
                                    tabIndex={-1}
                                  >
                                    <Info size={16} />
                                  </button>
                                )}

                                <button
                                  title="Скопировать номер"
                                  onClick={() => copyToClipboard(o.phone!)}
                                  className={uiBtnIcon}
                                  tabIndex={-1}
                                >
                                  <Info size={16} />
                                </button>
                              </>
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
                              className={`${badgeBase} ${
                                statusColors[o.status ?? 'pending'] || statusColors.pending
                              }`}
                            >
                              {statusOptions.find((s) => s.value === o.status)?.label || 'Ожидает подтверждения'}
                            </button>
                          </div>
                        </td>

                        <td className="p-3 border-b">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setDetailsOrder(o)} className={uiBtn}>
                              <ExternalLink size={14} /> Подробнее
                            </button>

                            <button
                              onClick={() =>
                                setDeleteModal({ id: o.id, label: o.order_number ? `#${o.order_number}` : o.id })
                              }
                              className={uiBtnDanger}
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

          <div className="lg:hidden px-4 py-4 space-y-3">
            {visibleOrders.map((o, i) => {
              const labelClient = o.contact_name || o.name || '-';
              const when = formatMskDateTime(o.created_at);
              const deliveryText = o.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка';
              const dateTime = o.delivery_date && o.delivery_time ? `${o.delivery_date} ${o.delivery_time}` : '-';
              const method = normalizeContactMethod(o);
              const methodText = contactLabel(method);

              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, delay: i * 0.008 }}
                  className="bg-white rounded-3xl border shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {o.order_number ? `Заказ #${o.order_number}` : `Заказ ${i + 1}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{when}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`${badgeBase} ${
                          statusColors[o.status ?? 'pending'] || statusColors.pending
                        }`}
                      >
                        {statusOptions.find((s) => s.value === o.status)?.label || 'Ожидает подтверждения'}
                      </span>

                      <span className={`${badgeBase} bg-white border-gray-200`}>{methodText}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Клиент:</span> <span className="font-semibold">{labelClient}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-gray-500">Телефон:</span>{' '}
                        <span className="font-semibold">{o.phone || '-'}</span>
                      </div>

                      {o.phone ? (
                        <div className="flex items-center gap-2">
                          {method === 'call' && (
                            <button onClick={() => window.open(`tel:${o.phone}`)} className={uiBtnIcon} title="Позвонить">
                              <Phone size={16} />
                            </button>
                          )}

                          {method === 'whatsapp' && (
                            <a
                              href={`https://wa.me/${digitsOnly(o.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={uiBtnIcon}
                              title="WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}

                          {method === 'telegram' && (
                            <button
                              onClick={() => openTelegramByPhone(o.phone!)}
                              className={uiBtnIcon}
                              title="Telegram"
                            >
                              <Send size={16} />
                            </button>
                          )}

                          {method === 'max' && (
                            <button onClick={() => openMaxByPhone(o.phone!)} className={uiBtnIcon} title="MAX">
                              <Info size={16} />
                            </button>
                          )}

                          <button onClick={() => copyToClipboard(o.phone!)} className={uiBtnIcon} title="Скопировать">
                            <Info size={16} />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <span className="text-gray-500">Доставка:</span>{' '}
                      <span className="font-semibold">{deliveryText}</span>{' '}
                      <span className="text-gray-500">({dateTime})</span>
                    </div>

                    <div className="break-words">
                      <span className="text-gray-500">Адрес:</span> <span className="font-semibold">{o.address || '-'}</span>
                    </div>

                    <div>
                      <span className="text-gray-500">Сумма:</span> <span className="font-semibold">{money(o.total)} ₽</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => setDetailsOrder(o)} className={uiBtn}>
                      <ExternalLink size={14} /> Подробнее
                    </button>

                    <button
                      onClick={() => setDeleteModal({ id: o.id, label: o.order_number ? `#${o.order_number}` : o.id })}
                      className={uiBtnDanger}
                    >
                      <Trash2 size={14} /> Удалить
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">Статус заказа</label>
                    <select
                      value={o.status ?? 'pending'}
                      onChange={(e) => updateStatus(o.id, e.target.value as (typeof statusOptions)[number]['value'])}
                      className="w-full border rounded-2xl px-3 py-2 text-sm bg-gray-50"
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

      {statusMenuPortal}

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
                    <div className="text-xs text-gray-500 mt-0.5">{formatMskDateTime(detailsOrder.created_at)}</div>
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
                  <div className="rounded-3xl border p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Клиент</div>
                    <div className="text-sm">
                      <div>
                        <span className="text-gray-500">Имя:</span>{' '}
                        <span className="font-semibold">{detailsOrder.contact_name || detailsOrder.name || '-'}</span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-gray-500">Телефон:</span>{' '}
                          <span className="font-semibold">{detailsOrder.phone || '-'}</span>
                        </div>

                        {detailsOrder.phone ? (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const method = normalizeContactMethod(detailsOrder);
                              if (method === 'call') {
                                return (
                                  <button
                                    onClick={() => window.open(`tel:${detailsOrder.phone}`)}
                                    className={uiBtnIcon}
                                    title="Позвонить"
                                  >
                                    <Phone size={16} />
                                  </button>
                                );
                              }
                              if (method === 'whatsapp') {
                                return (
                                  <a
                                    href={`https://wa.me/${digitsOnly(detailsOrder.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={uiBtnIcon}
                                    title="WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                );
                              }
                              if (method === 'telegram') {
                                return (
                                  <button
                                    onClick={() => openTelegramByPhone(detailsOrder.phone!)}
                                    className={uiBtnIcon}
                                    title="Telegram"
                                  >
                                    <Send size={16} />
                                  </button>
                                );
                              }
                              return (
                                <button
                                  onClick={() => openMaxByPhone(detailsOrder.phone!)}
                                  className={uiBtnIcon}
                                  title="MAX"
                                >
                                  <Info size={16} />
                                </button>
                              );
                            })()}

                            <button
                              onClick={() => copyToClipboard(detailsOrder.phone!)}
                              className={uiBtnIcon}
                              title="Скопировать"
                            >
                              <Info size={16} />
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-2">
                        <span className="text-gray-500">Способ связи:</span>{' '}
                        <span className="font-semibold">{contactLabel(normalizeContactMethod(detailsOrder))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Получатель</div>
                    <div className="text-sm">
                      <div>
                        <span className="text-gray-500">Имя:</span>{' '}
                        <span className="font-semibold">{detailsOrder.recipient || '-'}</span>
                      </div>

                      <div className="mt-1">
                        <span className="text-gray-500">Повод:</span>{' '}
                        <span className="font-semibold">{detailsOrder.occasion || '-'}</span>
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

                <section className="rounded-3xl border p-4">
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
                        <span className="font-semibold">
                          {detailsOrder.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}
                        </span>
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
                        {detailsOrder.promo_code ? (
                          <span className="text-gray-500"> (код: {detailsOrder.promo_code})</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-3xl border p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Пожелания (delivery_instructions)</div>
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {detailsOrder.delivery_instructions || '-'}
                    </div>
                  </div>

                  <div className="rounded-3xl border p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Текст открытки (postcard_text)</div>
                    <div className="text-sm whitespace-pre-wrap break-words">{detailsOrder.postcard_text || '-'}</div>
                  </div>
                </section>

                <section className="rounded-3xl border p-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Состав заказа</div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Основные товары</div>
                      {detailsOrder.items?.length ? (
                        <ul className="mt-2 space-y-2 text-sm">
                          {detailsOrder.items.map((it, idx) => (
                            <li key={idx} className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="h-12 w-12 rounded-2xl border bg-gray-50 overflow-hidden flex-shrink-0">
                                  {it.image_url ? (
                                    <Image
                                      src={it.image_url}
                                      alt=""
                                      width={48}
                                      height={48}
                                      className="h-12 w-12 object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="h-12 w-12 flex items-center justify-center text-[10px] text-gray-400">
                                      нет фото
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="break-words">
                                    {it.title} <span className="text-gray-500">x{it.quantity}</span>
                                  </div>

                                  {it.product_url ? (
                                    <Link
                                      href={it.product_url}
                                      target="_blank"
                                      className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink size={12} /> Открыть товар
                                    </Link>
                                  ) : null}
                                </div>
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

                <section className="rounded-3xl border p-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Быстрые действия</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setDeleteModal({
                          id: detailsOrder.id,
                          label: detailsOrder.order_number ? `#${detailsOrder.order_number}` : detailsOrder.id,
                        })
                      }
                      className={uiBtnDanger}
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
              className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full border"
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
                <button onClick={() => setDeleteModal(null)} className="px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 font-semibold">
                  Отмена
                </button>
                <button onClick={() => deleteOrder(deleteModal.id)} className="px-4 py-2 rounded-2xl bg-red-600 text-white hover:bg-red-700 font-semibold">
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
