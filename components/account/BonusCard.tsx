'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface BonusCardProps {
  balance: number;
  level: string;
}

export default function BonusCard({ balance, level }: BonusCardProps) {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallCard = async () => {
    setIsInstalling(true);
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) {
        toast.error('Пожалуйста, войдите в аккаунт');
        return;
      }
      const { phone } = JSON.parse(authData);

      const response = await fetch('/api/install-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: phone }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Не удалось установить карту');
      }

      toast.success('Карта установлена! Начислено 300 бонусов.');
      // Здесь можно обновить UI, вызвав fetchAccountData через пропс onUpdate, если он есть
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Ваш бонусный баланс</h3>
      <p className="text-2xl font-bold">{balance} баллов</p>
      <p className="text-sm text-gray-500 mt-2">
        Уровень: <span className="capitalize">{level}</span>
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Начисляется {level === 'bronze' ? 2.5 : level === 'silver' ? 5 : level === 'gold' ? 7.5 : level === 'platinum' ? 10 : 15}% от каждой покупки
      </p>
      <p className="text-sm text-gray-500">1 бонус = 1 ₽</p>
      <motion.button
        onClick={handleInstallCard}
        disabled={isInstalling}
        className={`mt-4 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
          isInstalling ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isInstalling ? 'Установка...' : 'Установить карту клиента'}
      </motion.button>
    </div>
  );
}
