// ✅ Путь: app/cart/components/steps/Step4DateTime.tsx
'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useCart } from '@context/CartContext';

interface FormSlice {
  date?: string;
  time?: string;
  deliveryMethod?: 'pickup' | 'delivery';
}

interface Props {
  form?: (FormSlice & { [key: string]: any }) | null;
  dateError: string;
  timeError: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface DaySchedule {
  start: string;
  end: string;
  enabled?: boolean;
}

interface StoreSettings {
  order_acceptance_enabled: boolean;
  order_acceptance_schedule: Record<string, DaySchedule>;
  store_hours: Record<string, DaySchedule>;
}

const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function ceilToStep(minutes: number, step: number): number {
  return Math.ceil(minutes / step) * step;
}

const TIME_STEP_MINUTES = 30;

const transformSchedule = (schedule: unknown): Record<string, DaySchedule> => {
  const base = Object.fromEntries(
    daysOfWeek.map(d => [
      d,
      { start: '09:00', end: '18:00', enabled: true },
    ]),
  ) as Record<string, DaySchedule>;

  if (typeof schedule !== 'object' || schedule === null) return base;

  for (const [key, value] of Object.entries(schedule)) {
    if (daysOfWeek.includes(key as any) && typeof value === 'object' && value) {
      const { start, end, enabled } = value as any;
      if (typeof start === 'string' && typeof end === 'string') {
        base[key] = {
          start,
          end,
          enabled: enabled === undefined ? true : !!enabled,
        };
      }
    }
  }
  return base;
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatDateRuShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export default function Step4DateTime({
  form,
  dateError,
  timeError,
  onFormChange,
}: Props) {
  const { items } = useCart() as any;

  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [minLabelToday, setMinLabelToday] = useState<string | null>(null);

  const [mode, setMode] = useState<'nearest' | 'custom'>('nearest');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isPickup = form?.deliveryMethod === 'pickup';
  const sectionTitle = isPickup ? 'Самовывоз' : 'Доставка';

  // максимальное время изготовления среди товаров в корзине
  const maxProductionTime = useMemo(() => {
    if (!Array.isArray(items) || !items.length) return 0;
    return items.reduce(
      (max: number, item: any) =>
        Math.max(max, item?.production_time ?? 0),
      0,
    );
  }, [items]);

  // загрузка настроек магазина
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const res = await fetch('/api/store-settings');
        const json = await res.json();
        if (res.ok && json.success) {
          setStoreSettings({
            order_acceptance_enabled:
              json.data.order_acceptance_enabled ?? false,
            order_acceptance_schedule: transformSchedule(
              json.data.order_acceptance_schedule,
            ),
            store_hours: transformSchedule(json.data.store_hours),
          });
        } else {
          console.error('Ошибка настроек магазина:', json.error);
        }
      } catch (e) {
        console.error('Ошибка загрузки настроек магазина:', e);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  // пересчёт слотов
  useEffect(() => {
    if (!storeSettings || isLoadingSettings || !form?.date) {
      setAvailableSlots([]);
      setMinLabelToday(null);
      return;
    }

    const date = new Date(form.date);
    if (Number.isNaN(date.getTime())) {
      setAvailableSlots([]);
      setMinLabelToday(null);
      return;
    }

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const weekdayKey = date
      .toLocaleString('en-US', { weekday: 'long' })
      .toLowerCase();

    const order = storeSettings.order_acceptance_schedule[weekdayKey];
    const store = storeSettings.store_hours[weekdayKey];

    const labelNoToday = isPickup
      ? 'Сегодня самовывоз недоступен, выберите другую дату.'
      : 'Сегодня доставка недоступна, выберите другую дату.';
    const labelNoDay = isPickup
      ? 'В этот день самовывоз недоступен.'
      : 'В этот день доставка недоступна.';

    if (
      !storeSettings.order_acceptance_enabled ||
      !order?.enabled ||
      !store?.enabled
    ) {
      setAvailableSlots([]);
      setMinLabelToday(isToday ? labelNoToday : labelNoDay);
      return;
    }

    const orderStart = parseTimeToMinutes(order.start)!;
    const orderEnd = parseTimeToMinutes(order.end)!;
    const storeStart = parseTimeToMinutes(store.start)!;
    const storeEnd = parseTimeToMinutes(store.end)!;

    const effectiveStart = Math.max(orderStart, storeStart);
    const effectiveEnd = Math.min(orderEnd, storeEnd);

    if (effectiveStart >= effectiveEnd) {
      setAvailableSlots([]);
      setMinLabelToday(labelNoDay);
      return;
    }

    // с учётом способа:
    // доставка: время изготовления + 30 мин
    // самовывоз: только время изготовления
    const extraMinutes =
      maxProductionTime +
      (form?.deliveryMethod === 'delivery' ? 30 : 0);

    let minMinutes: number;

    if (isToday) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const rawEarliest = nowMinutes + extraMinutes;
      minMinutes = Math.max(rawEarliest, effectiveStart);
      minMinutes = ceilToStep(minMinutes, TIME_STEP_MINUTES);

      if (minMinutes >= effectiveEnd) {
        setAvailableSlots([]);
        setMinLabelToday(
          isPickup
            ? 'Сегодня уже не успеваем подготовить заказ к выдаче, выберите другую дату.'
            : 'Сегодня уже не успеваем изготовить и доставить заказ, выберите другую дату.',
        );
        return;
      }

      const from = minutesToTimeString(minMinutes);
      const to = minutesToTimeString(effectiveEnd);

      setMinLabelToday(
        isPickup
          ? `Сегодня успеваем подготовить заказ к выдаче с ${from} до ${to}.`
          : `Сегодня успеваем доставить заказ с ${from} до ${to}.`,
      );
    } else {
      // на завтра и далее — с открытия окна
      minMinutes = effectiveStart;
      setMinLabelToday(null);
    }

    const slots: string[] = [];
    for (let t = minMinutes; t <= effectiveEnd; t += TIME_STEP_MINUTES) {
      slots.push(minutesToTimeString(t));
    }

    setAvailableSlots(slots);

    // если текущее выбранное время не попадает в слоты – подставляем первый слот
    if (slots.length > 0) {
      const currentMinutes = parseTimeToMinutes(form?.time);
      const minSlot = parseTimeToMinutes(slots[0])!;
      const maxSlot = parseTimeToMinutes(slots[slots.length - 1])!;

      if (
        currentMinutes === null ||
        currentMinutes < minSlot ||
        currentMinutes > maxSlot
      ) {
        const syntheticEvent = {
          target: {
            name: 'time',
            value: slots[0],
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onFormChange(syntheticEvent);
      }
    }
  }, [
    form?.date,
    form?.deliveryMethod,
    form?.time,
    maxProductionTime,
    storeSettings,
    isLoadingSettings,
    onFormChange,
    isPickup,
  ]);

  const handleDateChange = (value: string) => {
    const syntheticEvent = {
      target: {
        name: 'date',
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(syntheticEvent);
  };

  const handleTimeInputChange = (value: string) => {
    let finalValue = value;

    if (availableSlots.length > 0) {
      const minutes = parseTimeToMinutes(value);
      if (minutes !== null) {
        const minSlot = parseTimeToMinutes(availableSlots[0])!;
        const maxSlot = parseTimeToMinutes(
          availableSlots[availableSlots.length - 1],
        )!;
        let clamped = minutes;

        if (minutes < minSlot) clamped = minSlot;
        else if (minutes > maxSlot) clamped = maxSlot;
        else clamped = ceilToStep(minutes, TIME_STEP_MINUTES);

        finalValue = minutesToTimeString(clamped);
      }
    }

    const syntheticEvent = {
      target: {
        name: 'time',
        value: finalValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(syntheticEvent);
  };

  const handleQuickSlotClick = (slot: string) => {
    const syntheticEvent = {
      target: {
        name: 'time',
        value: slot,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(syntheticEvent);
  };

  const handleNearestClick = () => {
    if (!availableSlots.length) return;
    const syntheticEvent = {
      target: {
        name: 'time',
        value: availableSlots[0],
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(syntheticEvent);
  };

  const safeDate = form?.date || '';
  const safeTime = form?.time || '';

  const summary =
    safeDate && safeTime
      ? `${formatDateRuShort(safeDate)}, ${safeTime}`
      : 'Не выбрано';

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Заголовок блока (Доставка / Самовывоз) */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{sectionTitle}</div>
        <div className="text-xs text-gray-500">{summary}</div>
      </div>

      {/* Две карточки: Быстрее / Другое время */}
      <div className="grid grid-cols-2 gap-3">
        {/* Быстрее */}
        <button
          type="button"
          onClick={() => {
            setMode('nearest');
            if (!safeDate) {
              handleDateChange(todayIso);
            }
            handleNearestClick();
          }}
          className={`rounded-2xl border px-3 py-3 text-left transition ${
            mode === 'nearest'
              ? 'border-black bg-black text-white'
              : 'border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Быстрее</span>
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                mode === 'nearest'
                  ? 'border-white bg-white'
                  : 'border-gray-400'
              }`}
            >
              {mode === 'nearest' && (
                <span className="w-2 h-2 rounded-full bg-black" />
              )}
            </span>
          </div>
          <div
            className={`mt-1 text-xs ${
              mode === 'nearest' ? 'text-white/80' : 'text-gray-600'
            }`}
          >
            {safeDate && safeTime
              ? `${formatDateRuShort(safeDate)}, ${safeTime}`
              : isPickup
              ? 'Подберём ближайшее время, когда заказ будет готов к выдаче'
              : 'Подберём ближайшее доступное время доставки'}
          </div>
          <div
            className={`mt-2 text-[11px] ${
              mode === 'nearest' ? 'text-white/80' : 'text-gray-500'
            }`}
          >
            Бесплатно
          </div>
        </button>

        {/* Другое время */}
        <button
          type="button"
          onClick={() => {
            setMode('custom');
            if (!safeDate) {
              handleDateChange(todayIso);
            }
            setIsModalOpen(true);
          }}
          className={`rounded-2xl border px-3 py-3 text-left transition ${
            mode === 'custom'
              ? 'border-black bg-white'
              : 'border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center justify_between gap-2">
            <span className="text-sm font-semibold">Другое время</span>
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                mode === 'custom'
                  ? 'border-black'
                  : 'border-gray-400'
              }`}
            >
              {mode === 'custom' && (
                <span className="w-2 h-2 rounded-full bg-black" />
              )}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Выберите день и время
          </div>
        </button>
      </div>

      {(dateError || timeError) && (
        <p className="text-xs text-red-500">
          Пожалуйста, выберите дату и время.
        </p>
      )}

      {/* Подсказка про сегодня */}
      {minLabelToday && (
        <p className="text-xs text-gray-500 mt-1">{minLabelToday}</p>
      )}

      {/* Если нет слотов, но дата выбрана – предупреждение */}
      {safeDate &&
        !isLoadingSettings &&
        availableSlots.length === 0 &&
        !minLabelToday && (
          <p className="text-xs text-gray-500 mt-1">
            На выбранную дату не удалось подобрать подходящие интервалы времени.
            Попробуйте выбрать другое время или дату.
          </p>
        )}

      {/* НИЖНИЙ МОДАЛЬНЫЙ ЛИСТ "Другое время" */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-h-[75vh] rounded-t-3xl bg-white p-4 pb-5"
            >
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300" />
              <h3 className="text-base font-semibold mb-3">
                {isPickup
                  ? 'Выберите время самовывоза'
                  : 'Выберите дату и время доставки'}
              </h3>

              {/* Дата */}
              <div className="space-y-1 mb-3">
                <label className="block text-xs text-gray-500" htmlFor="date-modal">
                  Дата
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    <Image
                      src="/icons/calendar.svg"
                      alt="Дата"
                      width={16}
                      height={16}
                      loading="lazy"
                    />
                  </div>
                  <input
                    id="date-modal"
                    name="date"
                    type="date"
                    value={safeDate}
                    onChange={e => handleDateChange(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-base sm:text-sm ${
                      dateError ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-black`}
                    aria-label="Дата"
                    aria-invalid={!!dateError}
                  />
                </div>
                {dateError && (
                  <p className="text-xs text-red-500">{dateError}</p>
                )}
              </div>

              {/* Время */}
              <div className="space-y-1 mb-2">
                <label className="block text-xs text-gray-500" htmlFor="time-modal">
                  Время
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    <Image
                      src="/icons/clock.svg"
                      alt="Время"
                      width={16}
                      height={16}
                      loading="lazy"
                    />
                  </div>
                  <input
                    id="time-modal"
                    name="time"
                    type="time"
                    value={safeTime}
                    onChange={e => handleTimeInputChange(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-base sm:text-sm ${
                      timeError ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-black`}
                    aria-label="Время"
                    aria-invalid={!!timeError}
                    step={TIME_STEP_MINUTES * 60}
                  />
                </div>
                {timeError && (
                  <p className="text-xs text-red-500">{timeError}</p>
                )}
              </div>

              {/* Быстрые слоты */}
              {availableSlots.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {availableSlots.slice(0, 6).map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleQuickSlotClick(slot)}
                      className={`px-3 py-1 rounded-full border text-xs ${
                        safeTime === slot
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {minLabelToday && (
                <p className="text-xs text-gray-500 mb-3">{minLabelToday}</p>
              )}

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="mt-3 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white"
              >
                Готово
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
