'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';

import UiButton from '@components/ui/UiButton';
import { ChevronDown, ChevronUp, Repeat2, Package, Phone, MessageCircle } from 'lucide-react';

import { Order } from '@/types/order';

const displayStatusMap: { [key: string]: string } = {
  pending: 'Ожидает подтверждения',
  processing: 'В сборке',
  delivering: 'Доставляется',
  delivered: 'Доставлен',
  canceled: 'Отменён',
};

function fmtDate(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function statusTone(status: string) {
  if (status === 'delivered') return 'bg-black text-white';
  if (status === 'canceled') return 'bg-rose-600 text-white';
  if (status === 'delivering') return 'bg-black/5 text-black border border-black/10';
  if (status === 'processing') return 'bg-black/5 text-black border border-black/10';
  return 'bg-black/5 text-black border border-black/10';
}

interface OrdersListProps {
  orders: Order[] | undefined;
}

export default function OrdersList({ orders }: OrdersListProps) {
  const router = useRouter();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const sorted = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
  }, [orders]);

  if (!orders) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-black/60">Не удалось загрузить заказы. попробуйте позже.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-black/60">Нет заказов за выбранный период.</p>
      </div>
    );
  }

  return (
    <motion.section
      className="space-y-3"
      aria-labelledby="orders-list-title"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 id="orders-list-title" className="sr-only">
        Мои заказы
      </h2>

      {sorted.map((o, idx) => {
        const isExpanded = expandedOrder === o.id;

        // ✅ повтор заказа - приводим к формату корзины: { id: string, title, price, quantity, isUpsell?, category? }
        const draftItems = [
          ...(o.items || []).map((it) => ({
            id: String(it.product_id ?? ''),
            title: it.title,
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.cover_url || null,
          })),
          ...(o.upsell_details || []).map((upsell, uidx) => ({
            id: `upsell-${o.id}-${uidx}`,
            title: upsell.title,
            price: upsell.price,
            quantity: upsell.quantity,
            isUpsell: true,
            category: upsell.category,
            imageUrl: null,
          })),
        ].filter((x) => x.id && x.title);

        const statusText = displayStatusMap[o.status] || 'Статус не указан';

        return (
          <div
            key={o.id}
            className="rounded-3xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden"
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black text-white">
                      Заказ #{sorted.length - idx}
                    </span>
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${statusTone(o.status)}`}>
                      {statusText}
                    </span>
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/5 border border-black/10 text-black/70">
                      {fmtDate(o.created_at)}
                    </span>
                  </div>

                  <div className="text-sm text-black/70">
                    Получатель: <span className="font-semibold text-black/80">{o.recipient || 'Не указан'}</span>
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="text-2xl font-semibold tracking-tight">{o.total} ₽</div>
                    {!!o.bonuses_used && o.bonuses_used > 0 && (
                      <div className="text-sm text-black/55 pb-1">
                        списано бонусами: <span className="font-semibold">{o.bonuses_used} ₽</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex gap-2">
                  <UiButton
                    variant="brandOutline"
                    className="rounded-2xl px-4 py-3"
                    onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                    aria-label="Показать товары заказа"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Товары
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </UiButton>

                  <UiButton
                    variant="cartRed"
                    className="rounded-2xl px-4 py-3"
                    onClick={() => {
                      try {
                        const draft = { items: draftItems };

                        // ✅ пишем в два ключа: если корзина слушает другой - все равно сработает
                        localStorage.setItem('repeatDraft', JSON.stringify(draft));
                        localStorage.setItem('cartDraft', JSON.stringify(draft));

                        // ✅ и триггерим событие, если корзина на него подписана
                        window.dispatchEvent(new Event('repeatDraft'));

                        toast.success('Заказ подготовлен, открываю корзину');
                        router.push('/cart?repeat=1');

                        window.gtag?.('event', 'repeat_order', { event_category: 'account', order_id: o.id });
                        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'repeat_order', { order_id: o.id });
                      } catch {
                        toast.error('Не удалось подготовить повтор заказа');
                      }
                    }}
                    aria-label="Повторить заказ"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Repeat2 className="w-4 h-4" />
                      Повторить
                    </span>
                  </UiButton>
                </div>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-black/10 bg-black/[0.02]"
                >
                  <div className="p-4 sm:p-5">
                    <div className="text-sm font-semibold text-black/80">Товары в заказе</div>

                    <div className="mt-3 space-y-2">
                      {(o.items || []).map((item, i) => (
                        <div
                          key={`item-${i}`}
                          className="rounded-2xl border border-black/10 bg-white px-3 py-3 flex items-center gap-3"
                        >
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <Image
                              src={item.cover_url || '/no-image.jpg'}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-black/80 line-clamp-2">
                              {item.title}
                            </div>
                            <div className="text-xs text-black/50 mt-1">
                              {item.quantity} x {item.price} ₽
                            </div>
                          </div>
                        </div>
                      ))}

                      {(o.upsell_details || []).map((upsell, i) => (
                        <div
                          key={`upsell-${i}`}
                          className="rounded-2xl border border-black/10 bg-white px-3 py-3 flex items-center gap-3"
                        >
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <Image src="/no-image.jpg" alt={upsell.title} fill className="object-cover" sizes="48px" unoptimized />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-black/80 line-clamp-2">
                              {upsell.title}
                            </div>
                            <div className="text-xs text-black/50 mt-1">
                              {upsell.quantity} x {upsell.price} ₽
                              {upsell.category ? ` - ${upsell.category}` : ''}
                            </div>
                          </div>

                          <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-black/5 border border-black/10 text-black/70">
                            доп
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-black/80">Нужна помощь?</div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                        <a href="tel:+79886033821" className="inline-flex items-center gap-2 text-black hover:underline">
                          <Phone className="w-4 h-4" />
                          +7 (988) 603-38-21
                        </a>
                        <a href="https://wa.me/79886033821" className="inline-flex items-center gap-2 text-black hover:underline">
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.section>
  );
}
