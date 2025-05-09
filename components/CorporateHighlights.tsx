// ✅ Путь: components/CorporateHighlights.tsx
'use client';

import { motion } from 'framer-motion';

interface Highlight {
  title: string;
  description: string;
}

interface CorporateHighlightsProps {}

const highlights: Highlight[] = [
  {
    title: 'Персонализация',
    description: 'Добавим логотип вашей компании на упаковку и открытки с вашим текстом.',
  },
  {
    title: 'Документы для юрлиц',
    description: 'Предоставляем полный пакет документов для юридических лиц.',
  },
  {
    title: 'Бесплатная доставка',
    description: 'Доставим заказ по Краснодару бесплатно в удобный день.',
  },
  {
    title: 'Гибкость',
    description: 'Соберём подарки под ваш бюджет и учтём все пожелания.',
  },
];

export default function CorporateHighlights({}: CorporateHighlightsProps) {
  return (
    <section
      className="py-16 px-4 md:px-8 bg-white text-black"
      aria-labelledby="corporate-highlights-title"
    >
      <motion.h2
        id="corporate-highlights-title"
        className="text-3xl md:text-4xl font-bold text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Почему выбирают нас
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {highlights.map((highlight, index) => (
          <motion.article
            key={index}
            className="bg-white p-6 rounded-lg shadow-md text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            role="region"
            aria-labelledby={`highlight-title-${index}`}
          >
            <h3
              id={`highlight-title-${index}`}
              className="text-xl font-semibold mb-2"
            >
              {highlight.title}
            </h3>
            <p className="text-gray-600">{highlight.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}