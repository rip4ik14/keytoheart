// wedding/[slug]/page.tsx - Исправленная страница сбора средств
// Добавлен импорт Link из next/link

import { Metadata } from 'next';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link'; // Добавлено

export const metadata: Metadata = {
  title: 'Свадебная Копилка Алексея и Марии | KEY TO HEART – Соберите на сладкие подарки',
  description: 'Помогите Алексею и Марии собрать на год доставок клубники в шоколаде и цветов. Ваш вклад – трогательный подарок с пожеланием!',
  keywords: ['сбор на свадьбу', 'копилка для гостей', 'подарки молодожёнам Краснодар'],
  openGraph: {
    title: 'Соберём на сладкие подарки для Алексея и Марии',
    description: 'Ваш вклад превратится в ежемесячные букеты. Добавьте пожелание!',
    url: 'https://keytoheart.ru/wedding/example-wedding',
    images: [{ url: '/og-wedding-guest.webp', width: 1200, height: 630, alt: 'Страница свадебной копилки' }],
    type: 'website',
  },
  alternates: { canonical: 'https://keytoheart.ru/wedding/example-wedding' },
};

// Хардкод для примера
const weddingData = {
  couple: 'Алексей и Мария',
  date: '15 сентября 2023',
  goal: 50000,
  collected: 25000,
  contributors: 15,
};

export default function WeddingGuestPage() {
  const progress = (weddingData.collected / weddingData.goal) * 100;

  return (
    <main className="min-h-screen bg-white text-black py-12 px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Свадебная Копилка Алексея и Марии',
          description: 'Страница для сбора средств на подарки молодожёнам.',
        })}
      </script>

      <div className="max-w-4xl mx-auto space-y-12 text-center">
        <motion.section
          className="space-y-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight uppercase">
            Свадебная Копилка для {weddingData.couple}
          </h1>
          <p className="text-xl text-gray-600">
            Дата свадьбы: {weddingData.date}. Помогите собрать на год сладких сюрпризов – букеты клубники в шоколаде и цветов с доставкой в Краснодаре!
          </p>
          <Image
            src="/wedding-couple.jpg"
            alt={`Свадебная копилка ${weddingData.couple}`}
            width={800}
            height={400}
            className="rounded-lg shadow-lg mx-auto"
          />
        </motion.section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Собрано: {weddingData.collected} ₽ из {weddingData.goal} ₽</h2>
          <div className="bg-gray-200 rounded-full h-4">
            <motion.div
              className="bg-black h-4 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5 }}
            />
          </div>
          <p className="text-gray-600">Уже {weddingData.contributors} гостей внесли вклад!</p>
        </section>

        <section className="bg-gray-50 p-8 rounded-lg shadow-lg space-y-6">
          <h2 className="text-3xl font-bold tracking-tight uppercase">Внести вклад</h2>
          <form className="space-y-4">
            <input type="number" placeholder="Сумма (₽, мин. 500)" className="p-4 border rounded-lg w-full" />
            <textarea placeholder="Ваше пожелание молодожёнам" className="p-4 border rounded-lg w-full h-32" />
            <button type="submit" className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition">
              Внести и отправить пожелание
            </button>
          </form>
          <p className="text-sm text-gray-500">Ваш вклад анонимен, если не укажете имя. Деньги идут напрямую паре.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Поделитесь с друзьями</h2>
          <div className="flex justify-center gap-4">
            <Link href="#" className="bg-blue-500 text-white px-4 py-2 rounded">VK</Link>
            <Link href="#" className="bg-green-500 text-white px-4 py-2 rounded">WhatsApp</Link>
            <Link href="#" className="bg-blue-600 text-white px-4 py-2 rounded">Telegram</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
