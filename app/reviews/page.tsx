import type { Metadata } from 'next';
import Link from 'next/link';
import FlowwowReviewsBadge from '@/components/FlowwowReviewsBadge';

export const metadata: Metadata = {
  title: 'Отзывы',
  description:
    'Отзывы клиентов КЛЮЧ К СЕРДЦУ. Рейтинг на Flowwow, избранные отзывы покупателей и ссылки на реальные отзывы на агрегаторе.',
  alternates: { canonical: 'https://keytoheart.ru/reviews' },
};

const featured = [
  {
    name: 'Анна',
    date: 'Декабрь 2025',
    rating: 5,
    text: 'Дарила подруге на ДР, она была приятно удивлена! Радовалась, что вкусно и красиво! Спасибо! 🤍',
  },
  {
    name: 'Екатерина',
    date: 'Декабрь 2025',
    rating: 5,
    text: 'Замечательный букет, очень понравился и по вкусу и по виду!',
  },
  {
    name: 'Ольга',
    date: 'Декабрь 2025',
    rating: 5,
    text: 'Спасибо большое за вкусный букет! Это был важный знак внимания для любимой семьи и вы в этом мне очень помогли! Благодарю ❤️🙏🏻🍓',
  },
];

export default function ReviewsPage() {
  return (
    <main className="bg-white text-black">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Отзывы клиентов
        </h1>

        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Мы собираем отзывы на агрегаторе Flowwow и постепенно добавляем отзывы на сайт.
          Ниже - ссылка на все отзывы и несколько избранных.
        </p>

        <div className="mt-5">
          <FlowwowReviewsBadge />
        </div>

        <section className="mt-10 border-t pt-8" aria-label="Избранные отзывы">
          <h2 className="text-xl font-bold">Избранные отзывы</h2>

          <div className="mt-6 space-y-5">
            {featured.map((r, i) => (
              <article key={i} className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.date}</div>
                  </div>
                  <div className="text-sm font-semibold">
                    {'★'.repeat(r.rating)}
                    <span className="text-gray-400">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                </div>

                <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                  {r.text}
                </p>

                <div className="mt-3 text-xs text-gray-500">
                  Источник: <Link className="underline" href="https://flowwow.com/shop/key-to-heart/" target="_blank">Flowwow</Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <a
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-white font-bold hover:bg-gray-800 transition"
              href="https://flowwow.com/shop/key-to-heart/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Смотреть все отзывы на Flowwow
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
