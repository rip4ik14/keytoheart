// ✅ Путь: components/CorporateOfferings.tsx
'use client';

import { motion } from 'framer-motion';

interface Offering {
  title: string;
  description: string;
}

interface CorporateOfferingsProps {}

const offerings: Offering[] = [
  {
    title: 'Фруктово-цветочные композиции',
    description: 'Яркие и свежие букеты с фруктами для ваших сотрудников и партнёров.',
  },
  {
    title: 'Брендированные боксы',
    description: 'Подарочные боксы с логотипом вашей компании и индивидуальным дизайном.',
  },
  {
    title: 'Подарки на праздники',
    description: 'Сезонные подарки для корпоративных мероприятий и праздников.',
  },
];

export default function CorporateOfferings({}: CorporateOfferingsProps) {
  return (
    <section
      className="py-16 px-4 md:px-8 bg-white text-black"
      aria-labelledby="corporate-offerings-title"
    >
      <motion.h2
        id="corporate-offerings-title"
        className="text-3xl md:text-4xl font-bold text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Наши предложения
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {offerings.map((offering, index) => (
          <motion.article
            key={index}
            className="bg-white p-6 rounded-lg shadow-md text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            role="region"
            aria-labelledby={`offering-title-${index}`}
          >
            <h3
              id={`offering-title-${index}`}
              className="text-xl font-semibold mb-2"
            >
              {offering.title}
            </h3>
            <p className="text-gray-600">{offering.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}