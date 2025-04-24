'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@context/CartContext';
import { useEffect, useState } from 'react';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { repeatOrder } from '@utils/repeatOrder';



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
    const itemsToRepeat = repeatOrder(order);
    addMultipleItems(itemsToRepeat); // добавляем в корзину
    router.push('/cart');
  };

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div
          key={order.id}
          className="border border-gray-200 rounded-xl p-4 shadow-sm"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">Заказ от {new Date(order.created_at).toLocaleDateString()}</h3>
            <button
              onClick={() => handleRepeat(order)}
              className="px-3 py-1 border border-black rounded-full text-sm hover:bg-black hover:text-white transition"
            >
              Повторить заказ
            </button>
          </div>
          <div className="text-sm text-gray-600">Всего: {order.total_amount} ₽</div>
        </div>
      ))}
    </div>
  );
}
