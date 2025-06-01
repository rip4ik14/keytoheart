// ✅ Путь: app/cart/components/steps/Step4DateTime.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';

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
  onValidationChange: (isValid: boolean, errorMessage: string) => void;
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
  onValidationChange,
}: Props) {
  const [validationError, setValidationError] = useState<string>('');
  const [isTimeValid, setIsTimeValid] = useState<boolean>(true);

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

    const [endH, endM] = latestEnd.split(':').map(Number);
    const latest = new Date(selected);
    latest.setHours(endH, endM, 0, 0);

    if (isToday && minDateTime <= latest) {
      return minDateTime > earliest ? minDateTime : earliest;
    }

    return earliest;
  };

  const now = new Date();
  const minDate = getMinDate();
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

  const validateDeliveryTime = useCallback(() => {
    if (!form.date || !form.time || !storeSettings) {
      setValidationError('Пожалуйста, выберите дату и время доставки.');
      onValidationChange(false, 'Пожалуйста, выберите дату и время доставки.');
      setIsTimeValid(false);
      return;
    }

    const deliveryDate = new Date(form.date);
    const dayKey = deliveryDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

    const orderSchedule = storeSettings.order_acceptance_schedule[dayKey];
    if (!orderSchedule || !orderSchedule.start || !orderSchedule.end || orderSchedule.enabled === false) {
      setValidationError(
        `Выбранная дата доставки (${form.date}) недоступна для приёма заказов. Пожалуйста, выберите другую дату.`
      );
      onValidationChange(
        false,
        `Выбранная дата доставки (${form.date}) недоступна для приёма заказов. Пожалуйста, выберите другую дату.`
      );
      setIsTimeValid(false);
      return;
    }

    const storeSchedule = storeSettings.store_hours[dayKey];
    if (!storeSchedule || !storeSchedule.start || !storeSchedule.end || storeSchedule.enabled === false) {
      setValidationError(
        `Выбранная дата доставки (${form.date}) недоступна для доставки. Пожалуйста, выберите другую дату.`
      );
      onValidationChange(
        false,
        `Выбранная дата доставки (${form.date}) недоступна для доставки. Пожалуйста, выберите другую дату.`
      );
      setIsTimeValid(false);
      return;
    }

    const earliestStartTime = orderSchedule.start > storeSchedule.start ? orderSchedule.start : storeSchedule.start;
    const latestEndTime = orderSchedule.end < storeSchedule.end ? orderSchedule.end : storeSchedule.end;

    const now = new Date();
    const selected = new Date(form.date);
    const isToday =
      selected.getFullYear() === now.getFullYear() &&
      selected.getMonth() === now.getMonth() &&
      selected.getDate() === now.getDate();

    if (isToday && maxProductionTime != null) {
      const minDeliveryTime = new Date(now);
      minDeliveryTime.setHours(minDeliveryTime.getHours() + maxProductionTime);
      const minDeliveryTimeStr = `${String(minDeliveryTime.getHours()).padStart(2, '0')}:${String(
        minDeliveryTime.getMinutes()
      ).padStart(2, '0')}`;

      if (minDeliveryTimeStr > latestEndTime) {
        setValidationError(
          `Сегодня заказы на выбранное время (${form.time}) больше не принимаются, так как минимальное время доставки (${minDeliveryTimeStr}) превышает график работы магазина (${latestEndTime}). Пожалуйста, выберите другую дату.`
        );
        onValidationChange(
          false,
          `Сегодня заказы на выбранное время (${form.time}) больше не принимаются, так как минимальное время доставки (${minDeliveryTimeStr}) превышает график работы магазина (${latestEndTime}). Пожалуйста, выберите другую дату.`
        );
        setIsTimeValid(false);
        return;
      }

      if (form.time < minDeliveryTimeStr) {
        setValidationError(
          `Сегодня заказы на выбранное время (${form.time}) больше не принимаются, так как минимальное время доставки с учётом времени изготовления — ${minDeliveryTimeStr}. Пожалуйста, выберите время с ${minDeliveryTimeStr} до ${latestEndTime} или другую дату.`
        );
        onValidationChange(
          false,
          `Сегодня заказы на выбранное время (${form.time}) больше не принимаются, так как минимальное время доставки с учётом времени изготовления — ${minDeliveryTimeStr}. Пожалуйста, выберите время с ${minDeliveryTimeStr} до ${latestEndTime} или другую дату.`
        );
        setIsTimeValid(false);
        return;
      }
    }

    if (form.time < earliestStartTime) {
      onFormChange({ target: { name: 'time', value: earliestStartTime } } as any);
      toast(`Время доставки изменено на ${earliestStartTime}, так как магазин начинает работу с ${earliestStartTime}.`);
      setValidationError('');
      onValidationChange(true, '');
      setIsTimeValid(true);
      return;
    }

    if (form.time > latestEndTime) {
      onFormChange({ target: { name: 'time', value: latestEndTime } } as any);
      toast(`Время доставки изменено на ${latestEndTime}, так как магазин работает до ${latestEndTime}.`);
      setValidationError('');
      onValidationChange(true, '');
      setIsTimeValid(true);
      return;
    }

    setValidationError('');
    onValidationChange(true, '');
    setIsTimeValid(true);
  }, [form.date, form.time, storeSettings, maxProductionTime, onValidationChange, onFormChange]);

  useEffect(() => {
    validateDeliveryTime();
  }, [validateDeliveryTime]);

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
    validateDeliveryTime();
  };

  const onTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormChange(e);
    validateDeliveryTime();
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
              dateError || validationError ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-invalid={!!dateError || !!validationError}
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
              timeError || !isTimeValid ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-black`}
            aria-invalid={!!timeError || !isTimeValid}
            disabled={!storeSettings.order_acceptance_enabled || !isDateValid()}
          />
        </div>
        <p className="text-xs text-gray-500">
          Доставка с {earliestStart} до {latestEnd}
        </p>
        {timeError && <p className="text-red-500 text-xs">{timeError}</p>}
        {validationError && <p className="text-red-500 text-xs">{validationError}</p>}
      </motion.div>
    </div>
  );
}