'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@context/CartContext';
import { useEffect, useState } from 'react';
import { repeatOrder } from '@utils/repeatOrder';
import toast from 'react-hot-toast';
import { Order } from '@/types/order';

export default function AccountOrdersList({ phone }: { phone: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const { addMultipleItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!phone) return;
      try {
        const res = await fetch(`/api/account/orders?phone=${encodeURIComponent(phone)}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setOrders(json.data || []);
        } else {
          toast.error('Не удалось загрузить заказы');
        }
      } catch {
        toast.error('Ошибка загрузки заказов');
      }
    };
    fetchOrders();
  }, [phone]);

  const handleRepeat = async (order: Order) => {
    try {
      const itemsToRepeat = await repeatOrder(order);
      addMultipleItems(itemsToRepeat);
      toast.success('Заказ скопирован в корзину');
      router.push('/cart');
      window.gtag?.('event', 'repeat_order', {
        event_category: 'account',
        order_id: order.id,
      });
      window.ym?.(96644553, 'reachGoal', 'repeat_order', { order_id: order.id });
    } catch {
      toast.error('Не удалось повторить заказ');
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="account-orders-title">
      <h2 id="account-orders-title" className="sr-only">
        Список заказов
      </h2>
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">Нет заказов</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-200 rounded-xl p-4 shadow-sm"
            role="article"
            aria-labelledby={`order-${order.id}-title`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 id={`order-${order.id}-title`} className="font-semibold text-lg">
                Заказ №{order.id.slice(0, 8)} от {new Date(order.created_at).toLocaleDateString('ru-RU')}
              </h3>
              <button
                onClick={() => handleRepeat(order)}
                className="px-3 py-1 border border-black rounded-full text-sm hover:bg-black hover:text-white transition focus:outline-none focus:ring-2 focus:ring-black"
                aria-label={`Повторить заказ от ${new Date(order.created_at).toLocaleDateString('ru-RU')}`}
              >
                Повторить заказ
              </button>
            </div>
            <div className="text-sm text-gray-600">Всего: {order.total} ₽</div>
          </div>
        ))
      )}
    </section>
  );
}
