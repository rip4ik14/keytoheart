'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast'; // Добавляем импорт toast

interface DaySchedule {
  start: string;
  end: string;
}

interface Props {
  form: {
    date: string;
    time: string;
  };
  dateError: string;
  timeError: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  getMinDate: () => string;
  storeHours: Record<string, DaySchedule>;
  maxProductionTime: number | null;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

export default function Step4DateTime({
  form,
  dateError,
  timeError,
  onFormChange,
  getMinDate,
  storeHours,
  maxProductionTime,
}: Props) {
  // Получаем расписание для выбранной даты
  const selectedDate = form.date ? new Date(form.date) : new Date();
  const dayKey = selectedDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
  const schedule = storeHours[dayKey] || { start: '09:00', end: '18:00' };

  // Вычисляем минимальную дату и время с учётом maxProductionTime
  const getMinTime = () => {
    const now = new Date();
    let minTime = now;

    if (maxProductionTime != null) {
      minTime = new Date(now.getTime() + maxProductionTime * 60 * 60 * 1000);
    }

    const [startHour, startMinute] = schedule.start.split(':').map(Number);
    const scheduleStart = new Date(minTime);
    scheduleStart.setHours(startHour, startMinute, 0, 0);

    return minTime > scheduleStart ? minTime : scheduleStart;
  };

  const minTime = getMinTime();
  const minTimeString = `${minTime.getHours().toString().padStart(2, '0')}:${minTime
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = e.target.value;
    const [selectedHour, selectedMinute] = selectedTime.split(':').map(Number);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(selectedHour, selectedMinute, 0, 0);

    const minDateTime = getMinTime();
    if (selectedDateTime < minDateTime) {
      const newTime = `${minTime.getHours().toString().padStart(2, '0')}:${minTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      onFormChange({
        target: { name: 'time', value: newTime },
      } as React.ChangeEvent<HTMLInputElement>);
      toast.error(`Время доставки не может быть раньше, чем через ${maxProductionTime} часов от текущего времени.`);
    } else {
      onFormChange(e);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateValue = new Date(e.target.value);
    const minDate = new Date(getMinDate());
    const now = new Date();

    if (maxProductionTime != null) {
      minDate.setTime(now.getTime() + maxProductionTime * 60 * 60 * 1000);
    }

    if (selectedDateValue < minDate) {
      const newDate = minDate.toISOString().split('T')[0];
      onFormChange({
        target: { name: 'date', value: newDate },
      } as React.ChangeEvent<HTMLInputElement>);
      toast.error(`Дата доставки не может быть раньше, чем через ${maxProductionTime} часов от текущего времени.`);
    } else {
      onFormChange(e);
    }

    const newTime = `${minTime.getHours().toString().padStart(2, '0')}:${minTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    onFormChange({
      target: { name: 'time', value: newTime },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="space-y-4">
      <motion.div className="relative mb-2" variants={containerVariants}>
        <label htmlFor="date" className="text-sm font-medium mb-1 block text-gray-700">
          Дата
        </label>
        <motion.div
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 mt-4"
          whileHover={{ scale: 1.1 }}
        >
          <Image src="/icons/calendar-alt.svg" alt="Дата" width={16} height={16} />
        </motion.div>
        <input
          id="date"
          type="date"
          name="date"
          value={form.date}
          onChange={handleDateChange}
          min={getMinDate()}
          className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
            dateError ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
          aria-label="Выберите дату доставки"
          aria-invalid={dateError ? 'true' : 'false'}
        />
        {dateError && <p className="text-red-500 text-xs mt-1">{dateError}</p>}
      </motion.div>
      <motion.div className="relative" variants={containerVariants}>
        <label htmlFor="time" className="text-sm font-medium mb-1 block text-gray-700">
          Время
        </label>
        <motion.div
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 mt-4"
          whileHover={{ scale: 1.1 }}
        >
          <Image src="/icons/clock.svg" alt="Время" width={16} height={16} />
        </motion.div>
        <input
          id="time"
          type="time"
          name="time"
          value={form.time}
          onChange={handleTimeChange}
          min={minTimeString}
          max={schedule.end}
          className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
            timeError ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
          aria-label="Выберите время доставки"
          aria-invalid={timeError ? 'true' : 'false'}
        />
        <p className="text-sm text-gray-500 mt-1">
          Доставка доступна с {schedule.start} до {schedule.end}.
          {maxProductionTime != null && (
            <> Минимальное время доставки: через {maxProductionTime} {maxProductionTime === 1 ? 'час' : 'часов'}.</>
          )}
        </p>
        {timeError && <p className="text-red-500 text-xs mt-1">{timeError}</p>}
      </motion.div>
    </div>
  );
}