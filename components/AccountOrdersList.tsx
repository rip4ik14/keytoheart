'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@context/CartContext';
import { useEffect, useState } from 'react';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { repeatOrder } from '@utils/repeatOrder';
import toast from 'react-hot-toast';

export default function AccountOrdersList({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const { addMultipleItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) setOrders(data);
    };
    fetchOrders();
  }, [userId]);

  const handleRepeat = async (order: any) => {
    const itemsToRepeat = await repeatOrder(order); // Добавляем await
    addMultipleItems(itemsToRepeat);
    toast.success('Заказ скопирован в корзину');
    router.push('/cart');
    window.gtag?.('event', 'repeat_order', {
      event_category: 'account',
      order_id: order.id,
    });
    window.ym?.(12345678, 'reachGoal', 'repeat_order', { order_id: order.id });
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
              <h3
                id={`order-${order.id}-title`}
                className="font-semibold text-lg"
              >
                Заказ от {new Date(order.created_at).toLocaleDateString()}
              </h3>
              <button
                onClick={() => handleRepeat(order)}
                className="px-3 py-1 border border-black rounded-full text-sm hover:bg-black hover:text-white transition focus:outline-none focus:ring-2 focus:ring-black"
                aria-label={`Повторить заказ от ${new Date(
                  order.created_at
                ).toLocaleDateString()}`}
              >
                Повторить заказ
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Всего: {order.total_amount} ₽
            </div>
          </div>
        ))
      )}
    </section>
  );
}