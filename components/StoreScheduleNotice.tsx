'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

// Интерфейс для расписания
interface DaySchedule {
  start: string;
  end: string;
}

interface StoreScheduleNoticeProps {
  orderAcceptanceEnabled: boolean;
  orderSchedule: DaySchedule | null;
  storeHours: DaySchedule | null;
  currentDay: string;
}

export default function StoreScheduleNotice({
  orderAcceptanceEnabled,
  orderSchedule,
  storeHours,
  currentDay,
}: StoreScheduleNoticeProps) {
  // Варианты анимации для появления уведомления
  const noticeVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Если заказы принимаются или расписание загружается, не показываем уведомление
  if (orderAcceptanceEnabled && orderSchedule) {
    const { start, end } = orderSchedule;
    const currentTime = new Date().toTimeString().slice(0, 5);
    if (currentTime >= start && currentTime <= end) {
      return null;
    }
  }

  return (
    <motion.div
      className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-start gap-3"
      variants={noticeVariants}
      initial="hidden"
      animate="visible"
      role="alert"
      aria-label="Уведомление о расписании магазина"
    >
      <Image
        src="/icons/info-circle.svg"
        alt="Информация"
        width={20}
        height={20}
        className="text-gray-600"
      />
      <div className="text-sm text-gray-700">
        {!orderAcceptanceEnabled ? (
          <p>
            Магазин временно не принимает заказы. Пожалуйста, попробуйте позже.
          </p>
        ) : (
          <>
            <p>
              Заказы принимаются с{' '}
              {orderSchedule?.start || 'не указано'} до{' '}
              {orderSchedule?.end || 'не указано'} по местному времени.
            </p>
            {storeHours && (
              <p className="mt-1">
                Доставка доступна с {storeHours.start} до {storeHours.end}. Пожалуйста, выберите другое время или дату в разделе "Дата и время".
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}