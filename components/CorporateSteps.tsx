// ✅ Путь: components/CorporateSteps.tsx
'use client';

import { motion } from 'framer-motion';

interface Step {
  number: string;
  title: string;
  description: string;
}

interface CorporateStepsProps {}

const steps: Step[] = [
  {
    number: '01',
    title: 'Заявка',
    description: 'Оставьте заявку через форму на сайте.',
  },
  {
    number: '02',
    title: 'Согласование',
    description: 'Мы свяжемся с вами для обсуждения деталей.',
  },
  {
    number: '03',
    title: 'Производство',
    description: 'Соберём подарки с учётом ваших пожеланий.',
  },
  {
    number: '04',
    title: 'Доставка',
    description: 'Доставим заказ в удобный для вас день.',
  },
];

export default function CorporateSteps({}: CorporateStepsProps) {
  return (
    <section
      className="py-16 px-4 md:px-8 bg-white text-black"
      aria-labelledby="corporate-steps-title"
    >
      <motion.h2
        id="corporate-steps-title"
        className="text-3xl md:text-4xl font-bold text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Как мы работаем
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        {steps.map((step, index) => (
          <motion.article
            key={index}
            className="flex items-start space-x-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            role="region"
            aria-labelledby={`step-title-${index}`}
          >
            <div className="text-5xl font-bold text-gray-300">{step.number}</div>
            <div>
              <h3
                id={`step-title-${index}`}
                className="text-xl font-semibold mb-2 uppercase"
              >
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}