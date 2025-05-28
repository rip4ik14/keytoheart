'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface DaySchedule {
  start: string;
  end: string;
  enabled?: boolean;
}

interface Props {
  form: { date: string; time: string };
  dateError: string;
  timeError: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getMinDate: () => string;
  storeSettings: {
    order_acceptance_schedule: Record<string, DaySchedule>;
    store_hours: Record<string, DaySchedule>;
    order_acceptance_enabled: boolean;
  };
  maxProductionTime: number | null;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function Step4DateTime({
  form,
  dateError,
  timeError,
  onFormChange,
  getMinDate,
  storeSettings,
  maxProductionTime,
}: Props) {
  const selectedDate = form.date ? new Date(form.date) : new Date();
  const todayKey = selectedDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

  const orderSchedule = storeSettings.order_acceptance_schedule[todayKey] || { start: '09:00', end: '18:00', enabled: true };
  const storeSchedule = storeSettings.store_hours[todayKey] || { start: '09:00', end: '18:00', enabled: true };

  const earliestStart = orderSchedule.enabled && storeSchedule.enabled
    ? orderSchedule.start > storeSchedule.start ? orderSchedule.start : storeSchedule.start
    : '00:00';
  const latestEnd = orderSchedule.enabled && storeSchedule.enabled
    ? orderSchedule.end < storeSchedule.end ? orderSchedule.end : storeSchedule.end
    : '23:59';

  const computeMin = () => {
    const now = new Date();
    const selected = form.date ? new Date(form.date) : now;

    const isToday =
      selected.getFullYear() === now.getFullYear() &&
      selected.getMonth() === now.getMonth() &&
      selected.getDate() === now.getDate();

    let minDateTime = isToday ? new Date(now) : selected;

    if (isToday && maxProductionTime != null) {
      minDateTime.setHours(minDateTime.getHours() + maxProductionTime);
    }

    const [h, m] = earliestStart.split(':').map(Number);
    const earliest = new Date(selected);
    earliest.setHours(h, m, 0, 0);

    // Проверяем, возможно ли доставить заказ сегодня
    const [endH, endM] = latestEnd.split(':').map(Number);
    const latest = new Date(now);
    latest.setHours(endH, endM, 0, 0);

    if (isToday && minDateTime <= latest) {
      return minDateTime > earliest ? minDateTime : earliest;
    }

    return earliest;
  };

  const now = new Date();
  const minDate = now.toISOString().split('T')[0]; // Устанавливаем минимальную дату как текущую
  const minTimeDate = computeMin();
  const minTime = `${String(minTimeDate.getHours()).padStart(2, '0')}:${String(
    minTimeDate.getMinutes()
  ).padStart(2, '0')}`;

  const isDateValid = () => {
    if (!form.date) return false;
    const date = new Date(form.date);
    const dayKey = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const orderDaySchedule = storeSettings.order_acceptance_schedule[dayKey];
    const storeDaySchedule = storeSettings.store_hours[dayKey];
    return (
      orderDaySchedule?.enabled !== false &&
      storeDaySchedule?.enabled !== false &&
      date >= new Date(minDate)
    );
  };

  const onDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const selectedDate = new Date(val);
    if (selectedDate < new Date(minDate)) {
      onFormChange({ target: { name: 'date', value: minDate } } as any);
      toast.error(`Дата не может быть раньше ${minDate}`);
      return;
    }

    const dayKey = selectedDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const orderDaySchedule = storeSettings.order_acceptance_schedule[dayKey];
    const storeDaySchedule = storeSettings.store_hours[dayKey];

    if (!orderDaySchedule?.enabled || !storeDaySchedule?.enabled) {
      toast.error('Магазин не принимает заказы или не работает в выбранный день. Выберите другой день.');
      onFormChange({ target: { name: 'date', value: minDate } } as any);
      return;
    }

    onFormChange(e);

    if (form.time) {
      const newEarliestStart = orderDaySchedule.start > storeDaySchedule.start ? orderDaySchedule.start : storeDaySchedule.start;
      const newLatestEnd = orderDaySchedule.end < storeDaySchedule.end ? orderDaySchedule.end : storeDaySchedule.end;
      if (form.time < newEarliestStart || form.time > newLatestEnd) {
        onFormChange({ target: { name: 'time', value: newEarliestStart } } as any);
        toast(`Время доставки сброшено до ${newEarliestStart}, так как выбранный день имеет другое расписание.`);
      }
    }
  };

  const onTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val < minTime) {
      onFormChange({ target: { name: 'time', value: minTime } } as any);
      toast.error(`Время не может быть раньше ${minTime} с учётом времени изготовления.`);
    } else if (val > latestEnd) {
      onFormChange({ target: { name: 'time', value: latestEnd } } as any);
      toast.error(`Время не может быть позже ${latestEnd} согласно графику работы магазина.`);
    } else {
      onFormChange(e);
    }
  };

  return (
    <div className="space-y-4">
      {!storeSettings.order_acceptance_enabled && (
        <motion.div
          className="text-red-500 text-xs"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={containerVariants}
        >
          Приём заказов временно отключён. Выберите дату и время позже, когда приём заказов будет включён.
        </motion.div>
      )}

      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={containerVariants}
      >
        <label htmlFor="date" className="block text-xs text-gray-500">
          Дата
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Image src="/icons/calendar-alt.svg" alt="Дата" width={16} height={16} />
          </div>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={onDate}
            min={minDate}
            className={`w-full pl-10 pr-3 py-2 border rounded-md ${
              dateError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-invalid={!!dateError}
            disabled={!storeSettings.order_acceptance_enabled}
          />
        </div>
        {dateError && <p className="text-red-500 text-xs">{dateError}</p>}
      </motion.div>

      <motion.div
        className="space-y-1"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        <label htmlFor="time" className="block text-xs text-gray-500">
          Время
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Image src="/icons/clock.svg" alt="Время" width={16} height={16} />
          </div>
          <input
            id="time"
            name="time"
            type="time"
            value={form.time}
            onChange={onTime}
            min={minTime}
            max={latestEnd}
            className={`w-full pl-10 pr-3 py-2 border rounded-md ${
              timeError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-invalid={!!timeError}
            disabled={!storeSettings.order_acceptance_enabled || !isDateValid()}
          />
        </div>
        <p className="text-xs text-gray-500">
          Доставка с {earliestStart} до {latestEnd}
        </p>
        {timeError && <p className="text-red-500 text-xs">{timeError}</p>}
      </motion.div>
    </div>
  );
}