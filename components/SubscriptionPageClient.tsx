'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const plans = [
  {
    name: 'Ежемесячно',
    price: 499,
    period: '/мес',
    benefits: ['20% скидка на все', 'Удвоенные бонусы (5%)', 'Приоритетная доставка', 'Эксклюзивные товары'],
    buttonText: 'Подписаться',
  },
  {
    name: 'Ежегодно',
    price: 4999,
    period: '/год',
    benefits: ['Экономия 17% (2 мес бесплатно)', 'Все преимущества ежемесячной', 'Ранний доступ к новинкам', 'Персональные рекомендации'],
    buttonText: 'Подписаться и сэкономить',
  },
];

export default function SubscriptionPageClient() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight uppercase">Станьте частью Клуба КЛЮЧ К СЕРДЦУ</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Получите <span className="font-bold text-black">20% скидку навсегда</span>, удвоенные бонусы, приоритетную доставку и эксклюзивные товары.
          Экономьте на любимых букетах и подарках в Краснодаре!
        </p>
        <Image
          src="/subscription-hero.jpg"
          alt="Преимущества Premium Подписки"
          width={1200}
          height={600}
          className="rounded-lg shadow-lg mx-auto"
          priority
        />
      </motion.div>

      {/* Преимущества */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {[
          { icon: '/icons/discount.svg', title: '20% Скидка', desc: 'На все товары – клубнику в шоколаде, букеты и комбо-наборы.' },
          { icon: '/icons/bonus.svg', title: 'Удвоенные Бонусы', desc: '5% возврата с каждой покупки вместо 2.5%.' },
          { icon: '/icons/delivery.svg', title: 'Приоритет Доставка', desc: 'Бесплатно или быстрее на 30 мин в Краснодаре.' },
        ].map((b, i) => (
          <motion.div
            key={i}
            className="bg-gray-50 p-6 rounded-lg shadow-md text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
          >
            <Image src={b.icon} alt={b.title} width={60} height={60} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{b.title}</h3>
            <p className="text-gray-600">{b.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Планы */}
      <motion.div className="space-y-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h2 className="text-3xl font-bold tracking-tight uppercase">Выберите свой план</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              className="bg-white border border-gray-200 p-8 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2, duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <p className="text-4xl font-bold mb-2">
                {plan.price}₽ <span className="text-xl">{plan.period}</span>
              </p>
              <ul className="space-y-2 mb-6 text-left">
                {plan.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Image src="/icons/check.svg" alt="Check" width={20} height={20} />
                    {benefit}
                  </li>
                ))}
              </ul>
              <Link
                href={`/subscription/checkout?plan=${plan.name.toLowerCase()}`}
                className="block bg-black text-white py-3 px-6 rounded-lg font-bold hover:bg-gray-800 transition"
              >
                {plan.buttonText}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h2 className="text-3xl font-bold tracking-tight uppercase text-center">Часто задаваемые вопросы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { q: 'Как отменить подписку?', a: 'В личном кабинете в любой момент. Деньги за неиспользованный период вернутся.' },
            { q: 'Что если я пропущу оплату?', a: 'Мы напомним по email/SMS. Подписка приостановится до оплаты.' },
          ].map((faq, idx) => (
            <div key={idx} className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
