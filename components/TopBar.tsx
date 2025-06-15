'use client';

import { motion } from 'framer-motion';

const TEXT_ITEMS = [
  '• Фото букета перед доставкой',
  '• Доставка от 60 минут',
  '• Гарантия на цветы 3 дня',
  '• Кэшбэк с каждого заказа до 15 %',
];

const STRIP = TEXT_ITEMS.join('   •   '); // доп. пробелы для визуального отступа

export default function TopBar() {
  return (
    <div className="w-full overflow-hidden bg-black text-white">
      <div className="max-w-screen-2xl mx-auto px-2">
        <div className="relative w-full overflow-hidden">
          <motion.div
            className="flex w-max select-none whitespace-nowrap text-[13px] sm:text-sm py-2"
            initial={{ x: 0 }}
            animate={{ x: '-100%' }}
            transition={{
              repeat: Infinity,
              repeatType: 'loop',
              duration: 40,
              ease: 'linear',
            }}
            aria-roledescription="marquee"
            aria-label="Информационная панель"
          >
            <span className="mr-10">{STRIP}</span>
            <span aria-hidden="true">{STRIP}</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
