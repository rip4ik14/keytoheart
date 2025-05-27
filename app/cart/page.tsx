import { Suspense } from 'react';
import CartPageClient from './CartPageClient';

// Серверный компонент для страницы /cart
export default function CartPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Загрузка корзины...</div>}>
      <CartPageClient />
    </Suspense>
  );
}