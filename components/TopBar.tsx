// ✅  components/TopBar.tsx (замена)
'use client';

import { motion } from 'framer-motion';

const TEXT_ITEMS = [
  '• Фото букета перед доставкой •',
  '• Доставка от 2 ч •',
  '• Гарантия на цветы 3 дня •',
  '• Кэшбэк с каждого заказа до 15 % •',
];

// превращаем массив в единую строку с одним пробелом-разделителем
const STRIP = TEXT_ITEMS.join(' ');

export default function TopBar() {
  return (
    <div className="w-full overflow-hidden bg-black text-white">
      <motion.div
        className="flex w-max select-none whitespace-nowrap text-[13px] sm:text-sm py-2"
        initial={{ x: 0 }}
        animate={{ x: '-50%' }}                  // смещаем ровно на 50 %
        transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
        aria-roledescription="marquee"
        aria-label="Информационная панель"
      >
        {/* одна и та же строка дважды подряд — никакого зазора на стыке */}
        <span>{STRIP}</span><span aria-hidden="true">{STRIP}</span>
      </motion.div>
    </div>
  );
}
