// wedding-subscription/page.tsx - Страница создания свадебной копилки
// Без изменений, так как ошибок не было

import { Metadata } from 'next';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Свадебная Копилка Berry | KEY TO HEART – Соберите на подарки с доставкой в Краснодаре',
  description: 'Создайте свадебную копилку в KEY TO HEART: Гости скидываются, а вы получаете ежемесячные букеты клубники в шоколаде и цветов. Удобно, трогательно и вкусно!',
  keywords: ['свадебная копилка', 'подарки на свадьбу', 'сбор средств свадьба', 'доставка Краснодар'],
  openGraph: {
    title: 'Свадебная Копилка – Сладкие подарки на год от гостей',
    description: 'Гости вкладывают средства, вы получаете регулярные доставки. Создайте копилку за 1 минуту!',
    url: 'https://keytoheart.ru/wedding-subscription',
    images: [{ url: '/og-wedding.webp', width: 1200, height: 630, alt: 'Свадебная Копилка KEY TO HEART' }],
    type: 'website',
  },
  alternates: { canonical: 'https://keytoheart.ru/wedding-subscription' },
};

export default function WeddingSubscriptionPage() {
  return (
    <main className="min-h-screen bg-white text-black py-12 px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Свадебная Копилка Berry',
          description: 'Соберите средства от гостей на сладкие подарки с доставкой.',
          offers: {
            '@type': 'Offer',
            priceCurrency: 'RUB',
            price: '0',
            itemOffered: {
              '@type': 'Service',
              name: 'Wedding Fund',
            },
          },
        })}
      </script>

      <div className="max-w-6xl mx-auto space-y-12">
        <motion.section
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight uppercase">
            Свадебная Копилка Berry: Подарки от гостей на год вперёд!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Пусть гости подарят не деньги в конверте, а <span className="font-bold text-black">ежемесячные сюрпризы</span>: букеты клубники в шоколаде и цветов с доставкой в Краснодаре. Соберите средства легко – поделитесь ссылкой!
          </p>
          <Image
            src="/wedding-hero.jpg"
            alt="Свадебная копилка в действии"
            width={1200}
            height={600}
            className="rounded-lg shadow-lg mx-auto"
          />
          <Link
            href="#create"
            className="inline-block bg-black text-white py-3 px-8 rounded-lg font-bold hover:bg-gray-800 transition text-lg"
          >
            Создать копилку бесплатно
          </Link>
        </motion.section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight uppercase text-center">Как это работает?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Создайте копилку', desc: 'Укажите имена молодожёнов и дату свадьбы. Получите уникальную ссылку.' },
              { step: 2, title: 'Поделитесь с гостями', desc: 'Разошлите ссылку по приглашениям или в чат. Гости скидываются удобно онлайн.' },
              { step: 3, title: 'Получайте подарки', desc: 'После свадьбы – ежемесячные доставки сладких букетов на собранную сумму!' },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                className="bg-gray-50 p-6 rounded-lg shadow-md text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
              >
                <div className="text-4xl font-bold mb-4">{step.step}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="create" className="bg-gray-50 p-8 rounded-lg shadow-lg space-y-6">
          <h2 className="text-3xl font-bold tracking-tight uppercase text-center">Создайте свою копилку</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Имя жениха" className="p-4 border rounded-lg" />
            <input type="text" placeholder="Имя невесты" className="p-4 border rounded-lg" />
            <input type="date" placeholder="Дата свадьбы" className="p-4 border rounded-lg" />
            <input type="number" placeholder="Целевая сумма (₽)" className="p-4 border rounded-lg" />
            <button type="submit" className="md:col-span-2 bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition">
              Создать и получить ссылку
            </button>
          </form>
          <p className="text-center text-sm text-gray-500">Бесплатно, без комиссии. Деньги переводятся напрямую вам.</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight uppercase text-center">Часто задаваемые вопросы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: 'Сколько стоит создание копилки?', a: 'Бесплатно! Мы берём только 10% комиссии за доставки подарков.' },
              { q: 'Как гости увидят пожелания?', a: 'Каждый вклад с сообщением – оно придёт в открытке с доставкой.' },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
