'use client';

import { motion } from 'framer-motion';

interface BonusHistoryItem {
  amount: number;
  reason: string;
  created_at: string;
}

interface BonusHistoryProps {
  history: BonusHistoryItem[];
}

function fmtDate(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BonusHistory({ history }: BonusHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-black/60">Нет истории бонусов</p>
      </div>
    );
  }

  return (
    <motion.section
      className="rounded-3xl border border-black/10 bg-white p-4 sm:p-5 lg:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-labelledby="bonus-history-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="bonus-history-title" className="text-lg font-semibold tracking-tight">
          История бонусов
        </h3>
        <span className="text-xs text-black/45">последние операции</span>
      </div>

      <ul className="mt-4 space-y-2" role="list">
        {history.map((item, index) => {
          const plus = item.amount > 0;
          return (
            <li
              key={index}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 flex items-center justify-between gap-3"
              role="listitem"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black/80 truncate">
                  {item.reason || 'Операция'}
                </p>
                <p className="text-xs text-black/45 mt-1">{fmtDate(item.created_at)}</p>
              </div>

              <div
                className={`
                  shrink-0 text-sm font-bold
                  ${plus ? 'text-rose-700' : 'text-black'}
                `}
              >
                {plus ? `+${item.amount}` : item.amount}
              </div>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
