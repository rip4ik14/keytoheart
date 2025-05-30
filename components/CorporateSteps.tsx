'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

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
            aria-describedby={`step-desc-${index}`}
          >
            <div className="text-5xl font-bold text-gray-300">{step.number}</div>
            <div>
              <h3
                id={`step-title-${index}`}
                className="text-xl font-semibold mb-2 uppercase"
              >
                {step.title}
              </h3>
              <p id={`step-desc-${index}`} className="text-gray-600">
                {step.description}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
      <motion.div
        className="text-center mt-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <Link
          href="/form"
          className="inline-block border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
            bg-white text-[#535353] transition-all duration-200 shadow-sm
            hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
          onClick={() => {
            window.gtag?.('event', 'click_steps_cta', {
              event_category: 'CorporateSteps',
              event_label: 'Leave Request',
            });
            window.ym?.(96644553, 'reachGoal', 'click_steps_cta');
          }}
        >
          Оставить заявку
        </Link>
      </motion.div>
    </section>
  );
}