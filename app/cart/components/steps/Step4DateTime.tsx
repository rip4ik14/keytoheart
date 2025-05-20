// ✅ Путь: components/steps/Step4DateTime.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface DaySchedule { start: string; end: string; }
interface Props {
  form: { date: string; time: string };
  dateError: string;
  timeError: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getMinDate: () => string;
  storeHours: Record<string, DaySchedule>;
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
  storeHours,
  maxProductionTime,
}: Props) {
  const todayKey = new Date(form.date || Date.now())
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();
  const schedule = storeHours[todayKey] || { start: '09:00', end: '18:00' };

  const computeMin = () => {
    const now = new Date();
    if (maxProductionTime != null) {
      now.setHours(now.getHours() + maxProductionTime);
    }
    const [h, m] = schedule.start.split(':').map(Number);
    const earliest = new Date(now);
    earliest.setHours(h, m, 0, 0);
    return now > earliest ? now : earliest;
  };

  const minDate = getMinDate();
  const minTimeDate = computeMin();
  const minTime = `${String(minTimeDate.getHours()).padStart(2, '0')}:${String(
    minTimeDate.getMinutes()
  ).padStart(2, '0')}`;

  const onDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (new Date(val) < new Date(minDate)) {
      onFormChange({ target: { name: 'date', value: minDate } } as any);
      toast.error(`Дата не раньше ${minDate}`);
    } else {
      onFormChange(e);
    }
  };

  const onTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value < minTime) {
      onFormChange({ target: { name: 'time', value: minTime } } as any);
      toast.error(`Время не раньше ${minTime}`);
    } else {
      onFormChange(e);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl shadow-lg">
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={containerVariants}
      >
        <label htmlFor="date" className="block text-sm font-medium text-gray-900">
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
            className={`w-full pl-10 pr-3 py-2 border rounded-lg ${
              dateError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            aria-invalid={!!dateError}
          />
        </div>
        {dateError && <p className="text-red-500 text-xs">{dateError}</p>}
      </motion.div>

      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        <label htmlFor="time" className="block text-sm font-medium text-gray-900">
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
            max={schedule.end}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg ${
              timeError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            aria-invalid={!!timeError}
          />
        </div>
        <p className="text-xs text-gray-500">
          Доставка с {schedule.start} до {schedule.end}
        </p>
        {timeError && <p className="text-red-500 text-xs">{timeError}</p>}
      </motion.div>
    </div>
  );
}
