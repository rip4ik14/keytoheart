'use client';

import { motion } from 'framer-motion';

interface BonusCardProps {
  balance: number;
  level: string;
}

function levelMeta(level: string) {
  const map: Record<string, { name: string; cashback: number }> = {
    bronze: { name: 'Бронзовый', cashback: 2.5 },
    silver: { name: 'Серебряный', cashback: 5 },
    gold: { name: 'Золотой', cashback: 7.5 },
    platinum: { name: 'Платиновый', cashback: 10 },
    premium: { name: 'Премиум', cashback: 15 },
  };
  return map[level] || map.bronze;
}

export default function BonusCard({ balance, level }: BonusCardProps) {
  const meta = levelMeta(level);

  return (
    <motion.aside
      className="
        rounded-3xl border border-black/10 bg-white
        p-4 sm:p-5 lg:p-6
        shadow-[0_14px_40px_rgba(0,0,0,0.08)]
      "
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Бонусы и уровень"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Ваши бонусы</h3>
          <p className="text-sm text-black/55 mt-1">1 бонус = 1 ₽</p>
        </div>

        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/5 border border-black/10">
          {meta.name}
        </span>
      </div>

      <div className="mt-5">
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {Math.max(0, Math.round(balance || 0))} баллов
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="px-3 py-2 rounded-2xl border border-black/10 bg-white text-xs sm:text-sm font-semibold text-black/75">
            Кешбэк {meta.cashback}%
          </div>
          <div className="px-3 py-2 rounded-2xl border border-black/10 bg-white text-xs sm:text-sm font-semibold text-black/75">
            Списание до 15%
          </div>
        </div>

        <p className="mt-4 text-sm text-black/60 leading-relaxed">
          Бонусы начисляются с каждой покупки. срок действия - 6 месяцев с момента последней покупки.
        </p>
      </div>
    </motion.aside>
  );
}
