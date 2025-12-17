import { Suspense } from 'react';
import CartPageClient from './CartPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Серверный компонент для страницы /cart
export default function CartPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Загрузка корзины...</div>}>
      <CartPageClient />
    </Suspense>
  );
}
