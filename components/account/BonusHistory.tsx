// ✅ Путь: components/account/BonusHistory.tsx
'use client';

interface BonusHistoryItem {
  amount: number;
  reason: string;
  created_at: string;
}

interface BonusHistoryProps {
  history: BonusHistoryItem[];
}

export default function BonusHistory({ history }: BonusHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500">
        Нет истории бонусов
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="bonus-history-title">
      <h3 id="bonus-history-title" className="text-lg font-semibold mb-2">
        История бонусов
      </h3>
      <ul className="divide-y border border-gray-200 rounded-lg bg-white shadow-sm" role="list">
        {history.map((item, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-4 text-sm"
            role="listitem"
          >
            <div className="space-y-1">
              <p className="font-medium text-gray-800">{item.reason}</p>
              <p className="text-gray-500 text-xs">
                {new Date(item.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className="font-bold text-black">
              {item.amount > 0 ? `+${item.amount}` : item.amount}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}