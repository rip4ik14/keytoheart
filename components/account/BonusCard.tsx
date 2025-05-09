'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react'; // Добавляем импорт useEffect

interface BonusCardProps {
  balance: number;
  level: string;
}

export default function BonusCard({ balance, level }: BonusCardProps) {
  // Аналитика: просмотр бонусного баланса
  useEffect(() => {
    window.gtag?.('event', 'view_bonus_balance', {
      event_category: 'account',
      value: balance,
    });
    window.ym?.(12345678, 'reachGoal', 'view_bonus_balance', { balance });
  }, [balance]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="bg-white p-6 rounded-lg text-center shadow-sm flex flex-col items-center justify-center space-y-3 border border-gray-200 hover:shadow-md transition-shadow duration-300"
      role="region"
      aria-labelledby="bonus-card-title"
      aria-describedby="bonus-card-desc"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="text-3xl transform hover:scale-110 transition-transform duration-300" aria-hidden="true">
        🎁
      </div>
      <h2 id="bonus-card-title" className="font-semibold text-xl tracking-tight">
        Ваш бонусный баланс
      </h2>
      <p className="text-4xl font-bold text-black">{balance} баллов</p>
      <div id="bonus-card-desc" className="text-sm text-gray-600 space-y-1">
        <p>
          Уровень: <span className="font-medium">{level || '—'}</span>
        </p>
        <p className="text-gray-500 leading-relaxed">
          Начисляется 5% от каждой покупки
          <br />
          1 бонус = 1 ₽
        </p>
      </div>
    </motion.div>
  );
}