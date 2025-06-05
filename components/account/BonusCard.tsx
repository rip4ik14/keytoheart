'use client';

interface BonusCardProps {
  balance: number;
  level: string;
}

export default function BonusCard({ balance, level }: BonusCardProps) {
  

  // Определяем процент кешбэка на основе уровня
  const cashbackPercentage = level === 'bronze' ? 2.5 : level === 'silver' ? 5 : level === 'gold' ? 7.5 : level === 'platinum' ? 10 : 15;

  // Форматируем название уровня
  const levelName = level === 'bronze' ? 'Бронзовый' : level === 'silver' ? 'Серебряный' : level === 'gold' ? 'Золотой' : level === 'platinum' ? 'Платиновый' : 'Премиум';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Ваши бонусы</h3>
      <p className="text-2xl font-bold">{balance} баллов</p>
      <p className="text-sm text-gray-500 mt-2">Ваш уровень: {levelName}</p>
      <p className="text-sm text-gray-500 mt-1">
        Бонусы начисляются в размере {cashbackPercentage}% от каждой покупки
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Использовать бонусы можно при оформлении заказа, до 15% от суммы. 1 бонус = 1 ₽
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Срок действия бонусов: 6 месяцев с момента последней покупки
      </p>
    </div>
  );
}