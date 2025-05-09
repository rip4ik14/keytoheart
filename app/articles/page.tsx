// ✅ Путь: app/articles/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Статьи | KeyToHeart',
  description: 'Полезные статьи о клубничных букетах, цветах и подарках от KeyToHeart.',
  keywords: ['статьи', 'KeyToHeart', 'клубничные букеты'],
  openGraph: {
    title: 'Статьи | KeyToHeart',
    description: 'Узнайте больше о наших букетах и подарках.',
    url: 'https://keytoheart.ru/articles',
  },
  alternates: { canonical: 'https://keytoheart.ru/articles' },
  robots: 'noindex', // Временно, пока нет контента
};

export default function ArticlesPage() {
  return (
    <main className="container mx-auto px-4 py-10 bg-white text-black" aria-label="Статьи">
      <h1 className="text-2xl sm:text-3xl font-sans font-bold mb-4">Статьи</h1>
      <p className="text-gray-600">Здесь скоро появятся полезные статьи о наших букетах и подарках.</p>
    </main>
  );
}