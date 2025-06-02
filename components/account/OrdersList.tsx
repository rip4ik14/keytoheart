// account/component/OrdersList.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Order } from '@/types/order';

interface OrdersListProps {
  orders: Order[] | undefined;
}

export default function OrdersList({ orders }: OrdersListProps) {
  const router = useRouter();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Анимации для таблицы
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  const detailsVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.3 } },
  };

  if (!orders) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        Не удалось загрузить заказы. Попробуйте позже.
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        Нет заказов за выбранный период.
      </div>
    );
  }

  return (
    <motion.section
      className="overflow-x-auto"
      aria-labelledby="orders-list-title"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <h2 id="orders-list-title" className="text-lg font-semibold mb-4">
        Мои заказы
      </h2>
      <table className="w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-gray-500 uppercase text-xs">
            <th className="px-4 py-2">№</th>
            <th className="px-4 py-2">Получатель</th>
            <th className="px-4 py-2">Статус заказа</th>
            <th className="px-4 py-2">Дата заказа</th>
            <th className="px-4 py-2">Сумма</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => {
            // Собираем единый список товаров + доп. товары
            const draftItems = [
              ...o.items.map((it) => ({
                id: it.product_id,
                title: it.title,
                price: it.price,
                quantity: it.quantity,
                imageUrl: it.cover_url || '/no-image.jpg',
              })),
              ...o.upsell_details.map((upsell) => ({
                id: upsell.title,
                title: upsell.title,
                price: upsell.price,
                quantity: upsell.quantity,
                imageUrl: '/no-image.jpg',
                isUpsell: true,
                category: upsell.category,
              })),
            ];

            const isExpanded = expandedOrder === o.id;

            return (
              <React.Fragment key={o.id}>
                <motion.tr
                  className="bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg"
                  variants={rowVariants}
                >
                  {/* Порядковый номер: самый свежий заказ = №1 */}
                  <td className="px-4 py-3 font-medium">
                    {orders.length - idx}
                  </td>
                  <td className="px-4 py-3">{o.recipient || 'Не указан'}</td>
                  <td className="px-4 py-3 capitalize">{o.status}</td>
                  <td className="px-4 py-3">
                    {new Date(o.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold">{o.total} ₽</td>
                  <td className="px-4 py-3 text-right flex items-center gap-2">
                    <motion.button
                      className="text-black hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Посмотреть товары заказа #${o.id}`}
                    >
                      📦 Товары
                    </motion.button>
                    <motion.button
                      className="text-black hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      onClick={() => {
                        const draft = { items: draftItems };
                        localStorage.setItem('repeatDraft', JSON.stringify(draft));
                        toast.success('Заказ скопирован в корзину');
                        router.push('/cart');
                        window.gtag?.('event', 'repeat_order', {
                          event_category: 'account',
                          order_id: o.id,
                        });
                        window.ym?.(96644553, 'reachGoal', 'repeat_order', {
                          order_id: o.id,
                        });
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Повторить заказ #${o.id}`}
                    >
                      🔁 Повторить
                    </motion.button>
                  </td>
                </motion.tr>
                <tr>
                  <td colSpan={6} className="p-0">
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.td
                          colSpan={6} // Обновлено: было 7, теперь 6 колонок
                          className="p-4 bg-gray-50 border-t border-gray-200"
                          variants={detailsVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold">Товары в заказе:</h4>
                            <div className="space-y-2">
                              {o.items.map((item, idx) => (
                                <div key={`item-${idx}`} className="flex items-center gap-3">
                                  <Image
                                    src={item.cover_url || '/no-image.jpg'}
                                    alt={item.title}
                                    width={50}
                                    height={50}
                                    className="rounded-md object-cover"
                                  />
                                  <div>
                                    <p className="text-sm">{item.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {item.quantity} × {item.price} ₽
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {o.upsell_details.map((upsell, idx) => (
                                <div key={`upsell-${idx}`} className="flex items-center gap-3">
                                  <Image
                                    src="/no-image.jpg"
                                    alt={upsell.title}
                                    width={50}
                                    height={50}
                                    className="rounded-md object-cover"
                                  />
                                  <div>
                                    <p className="text-sm">
                                      {upsell.title} ({upsell.category})
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {upsell.quantity} × {upsell.price} ₽
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.td>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-gray-700">
        Возникли вопросы по заказу? Свяжитесь с нами по номеру{' '}
        <a href="tel:+79886033821" className="text-blue-600 hover:underline">
          +7 (988) 603-38-21
        </a>{' '}
        или напишите в{' '}
        <a href="https://wa.me/79886033821" className="text-blue-600 hover:underline">
          WhatsApp
        </a>
      </p>
    </motion.section>
  );
}