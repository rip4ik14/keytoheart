// lib/articles.tsx
import React, { ReactNode } from 'react';

export interface ArticleData {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  content: ReactNode;
}

export const articles: ArticleData[] = [
  {
    slug: 'why-best-2025',
    title: 'Почему клубничные букеты — лучший подарок в 2025 году',
    description:
      'Узнайте, почему клубничные букеты от KEY TO HEART стали хитом в Краснодаре в 2025 году и как выбрать идеальный подарок для любого случая.',
    datePublished: '2025-05-20',
    content: (
      <article className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">
          Почему клубничные букеты — лучший подарок в 2025 году
        </h1>

        <p className="text-gray-700 leading-relaxed">
          Клубничные букеты от <strong>KEY TO HEART</strong> — это современная альтернатива
          традиционным цветочным композициям. Вместо цветов в них используются спелые ягоды клубники,
          покрытые качественным шоколадом, дополненные зеленью и декоративными деталями. Каждый букет
          создаётся вручную мастерами, что гарантирует уникальность и высокое качество подарка.
        </p>

        <h2 className="text-2xl font-semibold">Что такое клубничный букет?</h2>
        <p className="text-gray-700 leading-relaxed">
          Клубничный букет сочетает в себе эстетику цветочной композиции и сладкий вкус десерта.
          Ягоды аккуратно насаживаются на шпажки и формируют причудливые «цветы», которые затем
          упаковываются в подарочную коробку. Такая презентация выглядит эффектно и сразу создаёт
          праздничное настроение.
        </p>

        <h2 className="text-2xl font-semibold">Преимущества клубничного букета</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Свежесть и вкус:</strong> настоящий десерт, который можно сразу же съесть.</li>
          <li><strong>Визуальная привлекательность:</strong> яркие ягоды и элегантная упаковка.</li>
          <li><strong>Универсальность:</strong> подходит для дня рождения, юбилея, свидания или корпоратива.</li>
          <li><strong>Персонализация:</strong> можно добавить топперы, зелень, цветы или брендовые элементы.</li>
          <li><strong>Эксклюзивность:</strong> каждый букет — ручная работа, нет двух одинаковых.</li>
        </ul>

        <h2 className="text-2xl font-semibold">Когда дарить клубничный букет</h2>
        <p className="text-gray-700 leading-relaxed">
          Такой подарок уместен в любой сезон и для любого получателя:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>День рождения:</strong> сладкий сюрприз вместо стандартных тортов.</li>
          <li><strong>Юбилей и годовщина:</strong> необычная романтическая композиция.</li>
          <li><strong>Корпоративный подарок:</strong> брендированные букеты для партнёров и сотрудников.</li>
          <li><strong>Признание и благодарность:</strong> знак внимания и заботы.</li>
        </ul>

        <h2 className="text-2xl font-semibold">Как выбрать идеальный букет</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li><strong>Определитесь с размером:</strong> мини-букет, средний или пышная композиция.</li>
          <li><strong>Выберите тип шоколада:</strong> молочный, тёмный или белый.</li>
          <li><strong>Добавьте декор:</strong> живые цветы, сахарные топперы или логотип компании.</li>
          <li><strong>Укажите персональные пожелания:</strong> открытка или гравировка шпажек.</li>
        </ol>

        <h2 className="text-2xl font-semibold">Почему именно KEY TO HEART</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Отборная клубника:</strong> только лучшие ягоды с проверенных ферм.</li>
          <li><strong>Премиальный шоколад:</strong> высококачественные ингредиенты.</li>
          <li><strong>Ручная сборка:</strong> флористы и кондитеры создают каждый букет вручную.</li>
          <li><strong>Быстрая доставка:</strong> по Краснодару за 60 минут.</li>
          <li><strong>Гарантия свежести:</strong> сохраняются до 24 часов при правильном хранении.</li>
        </ul>

        <p className="text-gray-700 leading-relaxed">
          Закажите клубничный букет в&nbsp;
          <a href="/catalog" className="text-pink-600 hover:underline">
            каталоге KEY TO HEART
          </a>
          &nbsp;и подарите сладкую радость уже сегодня!
        </p>
      </article>
    ),
  },
  {
    slug: 'freshness-tips',
    title: '10 советов по продлению свежести клубничных букетов',
    description:
      'Сохраните свежесть клубничных букетов до 24 часов: подборка проверенных лайфхаков от мастеров KEY TO HEART.',
    datePublished: '2025-06-28',
    content: (
      <article className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">
          10 советов по продлению свежести клубничных букетов
        </h1>
        <p className="text-gray-700 leading-relaxed">
          Чтобы клубничные букеты радовали свежестью максимально долго, придерживайтесь этих рекомендаций:
        </p>
        <ol className="list-decimal list-inside space-y-4 text-gray-700">
          <li><strong>Храните в прохладе.</strong> Идеальная температура — +4…+8 °C.</li>
          <li><strong>Не трясите букет.</strong> Берегите ягоды от механических повреждений.</li>
          <li><strong>Избегайте влажности.</strong> Влага разрушает шоколадное покрытие.</li>
          <li><strong>Проветрите перед хранением.</strong> Дайте воздуху циркулировать 5–10 минут.</li>
          <li><strong>Упакуйте в пергамент.</strong> Он защитит от конденсата.</li>
          <li><strong>Не сбрызгивайте водой.</strong> Клубника впитывает лишнюю влагу.</li>
          <li><strong>Подавайте перед вручением.</strong> Достаньте букет за 10 минут до вручения.</li>
          <li><strong>Используйте термопакет при перевозке.</strong></li>
          <li><strong>Оставляйте в оригинальной упаковке.</strong> Она поддерживает оптимальный микроклимат.</li>
          <li><strong>Контролируйте срок.</strong> Не храните дольше 24 часов.</li>
        </ol>
      </article>
    ),
  },
];
