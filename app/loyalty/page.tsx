import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts'; // Исправляем импорт
import LoyaltyPageClient from './LoyaltyPageClient';

export const metadata: Metadata = {
  title: 'Программа лояльности • до 15% бонусами | KeyToHeart',
  description:
    'Получайте кешбэк до 15% за каждый заказ на KeyToHeart и оплачивайте им до 15% следующих покупок.',
  keywords: ['программа лояльности', 'KeyToHeart', 'бонусы'],
  openGraph: {
    title: 'Программа лояльности | KeyToHeart',
    description: 'Получайте кешбэк до 15%.',
    images: '/og-cover.jpg',
    url: 'https://keytoheart.ru/loyalty',
  },
  alternates: { canonical: 'https://keytoheart.ru/loyalty' },
};

export default function LoyaltyPage() {
  return (
    <main aria-label="Программа лояльности">
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage', // Удаляем '@context', так как JsonLd добавляет его автоматически
          name: 'Программа лояльности',
          url: 'https://keytoheart.ru/loyalty',
          description: 'Получайте кешбэк до 15% за заказы.',
        }}
      />
      <LoyaltyPageClient />
    </main>
  );
}