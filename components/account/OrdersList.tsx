'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';

type OrderItem = {
  products: { title: string; cover_url: string | null };
  quantity: number;
  price: number;
  product_id: number;
};

type Order = {
  id: number;
  created_at: string;
  total: number;
  bonuses_used: number;
  payment_method: 'cash' | 'card';
  status: string;
  order_items: OrderItem[];
};

interface OrdersListProps {
  orders: Order[] | undefined;
}

export default function OrdersList({ orders }: OrdersListProps) {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  // Проверка на undefined
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
      <h2 id="orders-list-title" className="sr-only">
        Список заказов
      </h2>
      <table className="w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-gray-500 uppercase text-xs">
            <th className="px-4 py-2">Номер</th>
            <th className="px-4 py-2">Оплата</th>
            <th className="px-4 py-2">Статус</th>
            <th className="px-4 py-2">Дата</th>
            <th className="px-4 py-2">Сумма</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <motion.tr
              key={o.id}
              className="bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg"
              variants={rowVariants}
            >
              <td className="px-4 py-3 font-medium">#{o.id}</td>
              <td className="px-4 py-3">
                {o.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}
              </td>
              <td className="px-4 py-3 capitalize">{o.status}</td>
              <td className="px-4 py-3">
                {new Date(o.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3 font-semibold">{o.total} ₽</td>
              <td className="px-4 py-3 text-right">
                <motion.button
                  className="text-black hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  onClick={() => {
                    const draft = {
                      items: o.order_items.map((it) => ({
                        id: it.product_id,
                        title: it.products.title,
                        price: it.price,
                        quantity: it.quantity,
                        imageUrl: it.products.cover_url || '/no-image.jpg',
                      })),
                    };
                    localStorage.setItem('repeatDraft', JSON.stringify(draft));
                    toast.success('Заказ скопирован в корзину');
                    router.push('/cart');
                    window.gtag?.('event', 'repeat_order', {
                      event_category: 'account',
                      order_id: o.id,
                    });
                    window.ym?.(12345678, 'reachGoal', 'repeat_order', {
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
          ))}
        </tbody>
      </table>
    </motion.section>
  );
}