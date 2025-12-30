// ✅ Путь: app/cart/components/steps/Step4DateTime.tsx
'use client';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const TIME_STEP_MINUTES = 30;
const NEAREST_LOOKAHEAD_DAYS = 21;

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

function formatDateRuShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function dateToIsoLocal(d: Date): string {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const transformSchedule = (schedule: unknown): Record<string, DaySchedule> => {
  const base = Object.fromEntries(
    daysOfWeek.map(d => [d, { start: '09:00', end: '18:00', enabled: true }]),
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
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

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

  const [isFindingNearest, setIsFindingNearest] = useState(false);

  // если пользователь нажал "Быстрее", но настройки еще грузятся - подхватим позже
  const pendingNearestRef = useRef(false);

  const isPickup = form?.deliveryMethod === 'pickup';
  const sectionTitle = isPickup ? 'Самовывоз' : 'Доставка';

  const safeDate = form?.date || '';
  const safeTime = form?.time || '';

  // максимальное время изготовления среди товаров в корзине
  const maxProductionTime = useMemo(() => {
    if (!Array.isArray(items) || !items.length) return 0;
    return items.reduce(
      (max: number, item: any) => Math.max(max, item?.production_time ?? 0),
      0,
    );
  }, [items]);

  const handleDateChange = (value: string) => {
    const syntheticEvent = {
      target: { name: 'date', value },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(syntheticEvent);
  };

  const handleTimeSet = (value: string) => {
    const syntheticEvent = {
      target: { name: 'time', value },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(syntheticEvent);
  };

  // ===== загрузка настроек магазина =====
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const res = await fetch('/api/store-settings');
        const json = await res.json();
        if (res.ok && json.success) {
          setStoreSettings({
            order_acceptance_enabled: json.data.order_acceptance_enabled ?? false,
            order_acceptance_schedule: transformSchedule(json.data.order_acceptance_schedule),
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

  // ===== функция поиска ближайшего слота (может быть завтра/послезавтра) =====
  const findNearestSlot = useMemo(() => {
    if (!storeSettings) return null;

    return (startDate: Date) => {
      const now = new Date();

      const extraMinutes =
        maxProductionTime + (form?.deliveryMethod === 'delivery' ? 30 : 0);

      const labelNoAny = isPickup
        ? 'Ближайшее время самовывоза недоступно, выберите дату вручную.'
        : 'Ближайшее время доставки недоступно, выберите дату вручную.';

      if (!storeSettings.order_acceptance_enabled) {
        return { ok: false as const, message: labelNoAny };
      }

      for (let i = 0; i < NEAREST_LOOKAHEAD_DAYS; i += 1) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);

        const weekdayKey = d
          .toLocaleString('en-US', { weekday: 'long' })
          .toLowerCase();

        const order = storeSettings.order_acceptance_schedule[weekdayKey];
        const store = storeSettings.store_hours[weekdayKey];

        if (!order?.enabled || !store?.enabled) continue;

        const orderStart = parseTimeToMinutes(order.start);
        const orderEnd = parseTimeToMinutes(order.end);
        const storeStart = parseTimeToMinutes(store.start);
        const storeEnd = parseTimeToMinutes(store.end);

        if (
          orderStart === null ||
          orderEnd === null ||
          storeStart === null ||
          storeEnd === null
        ) {
          continue;
        }

        const effectiveStart = Math.max(orderStart, storeStart);
        const effectiveEnd = Math.min(orderEnd, storeEnd);
        if (effectiveStart >= effectiveEnd) continue;

        const isToday = isSameDay(d, now);

        let minMinutes: number;
        if (isToday) {
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const rawEarliest = nowMinutes + extraMinutes;
          minMinutes = Math.max(rawEarliest, effectiveStart);
          minMinutes = ceilToStep(minMinutes, TIME_STEP_MINUTES);
        } else {
          minMinutes = effectiveStart;
        }

        if (minMinutes >= effectiveEnd) continue;

        return {
          ok: true as const,
          dateIso: dateToIsoLocal(d),
          time: minutesToTimeString(minMinutes),
        };
      }

      return { ok: false as const, message: labelNoAny };
    };
  }, [storeSettings, maxProductionTime, form?.deliveryMethod, isPickup]);

  // ===== пересчет слотов для выбранной даты (модалка и быстрые кнопки) =====
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
    const isToday = isSameDay(date, now);

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

    const extraMinutes =
      maxProductionTime + (form?.deliveryMethod === 'delivery' ? 30 : 0);

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
      minMinutes = effectiveStart;
      setMinLabelToday(null);
    }

    const slots: string[] = [];
    for (let t = minMinutes; t <= effectiveEnd; t += TIME_STEP_MINUTES) {
      slots.push(minutesToTimeString(t));
    }

    setAvailableSlots(slots);

    // если выбранное время не попадает в слоты - подставляем первый слот
    if (slots.length > 0) {
      const currentMinutes = parseTimeToMinutes(form?.time);
      const minSlot = parseTimeToMinutes(slots[0])!;
      const maxSlot = parseTimeToMinutes(slots[slots.length - 1])!;

      if (
        currentMinutes === null ||
        currentMinutes < minSlot ||
        currentMinutes > maxSlot
      ) {
        handleTimeSet(slots[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form?.date,
    form?.deliveryMethod,
    form?.time,
    maxProductionTime,
    storeSettings,
    isLoadingSettings,
    isPickup,
  ]);

  // ===== если nearest был нажат пока грузились настройки - применим после загрузки =====
  useEffect(() => {
    if (!pendingNearestRef.current) return;
    if (isLoadingSettings) return;
    if (!storeSettings || !findNearestSlot) return;

    const res = findNearestSlot(new Date());
    if (res.ok) {
      handleDateChange(res.dateIso);
      handleTimeSet(res.time);
    } else {
      setMinLabelToday(res.message);
      setAvailableSlots([]);
    }

    pendingNearestRef.current = false;
    setIsFindingNearest(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingSettings, storeSettings, findNearestSlot]);

  const handleApplyNearest = () => {
    setMode('nearest');
    setIsModalOpen(false);
    setIsFindingNearest(true);

    if (isLoadingSettings || !storeSettings || !findNearestSlot) {
      pendingNearestRef.current = true;
      return;
    }

    const res = findNearestSlot(new Date());
    if (res.ok) {
      handleDateChange(res.dateIso);
      handleTimeSet(res.time);
      setIsFindingNearest(false);
      return;
    }

    setMinLabelToday(res.message);
    setAvailableSlots([]);
    setIsFindingNearest(false);
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

    handleTimeSet(finalValue);
  };

  const handleQuickSlotClick = (slot: string) => handleTimeSet(slot);

  const summary =
    safeDate && safeTime ? `${formatDateRuShort(safeDate)}, ${safeTime}` : 'Не выбрано';

  // визуальная логика
  const nearestActive = mode === 'nearest';
  const nearestSelected = nearestActive && !!safeDate && !!safeTime;
  const customSelected = mode === 'custom';

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Заголовок блока */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{sectionTitle}</div>
        <div className="text-xs text-gray-500">{summary}</div>
      </div>

      {/* Карточки выбора */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Быстрее */}
        <button
          type="button"
          disabled={isFindingNearest}
          onClick={handleApplyNearest}
          className={[
            'rounded-2xl border px-4 py-3 text-left transition',
            'min-h-[92px] sm:min-h-[104px]',
            nearestActive ? 'border-black' : 'border-gray-300',
            nearestSelected ? 'bg-black text-white' : 'bg-white text-black',
            isFindingNearest ? 'opacity-90 cursor-wait' : '',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Быстрее</span>
              {isFindingNearest && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-current/30">
                  Подбираем...
                </span>
              )}
            </div>

            <span
              className={[
                'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0',
                nearestSelected ? 'border-white bg-white' : nearestActive ? 'border-black' : 'border-gray-400',
              ].join(' ')}
            >
              {nearestSelected && <span className="w-2 h-2 rounded-full bg-black" />}
            </span>
          </div>

          <div
            className={[
              'mt-1 text-xs leading-snug',
              nearestSelected ? 'text-white/80' : 'text-gray-600',
            ].join(' ')}
          >
            {safeDate && safeTime
              ? `${formatDateRuShort(safeDate)}, ${safeTime}`
              : isPickup
              ? 'Подберём ближайшее время, когда заказ будет готов к выдаче'
              : 'Подберём ближайшее доступное время доставки'}
          </div>

          <div
            className={[
              'mt-2 text-[11px]',
              nearestSelected ? 'text-white/80' : 'text-gray-500',
            ].join(' ')}
          >
            Бесплатно
          </div>
        </button>

        {/* Другое время */}
        <button
          type="button"
          onClick={() => {
            pendingNearestRef.current = false;
            setIsFindingNearest(false);
            setMode('custom');
            setIsModalOpen(true);
          }}
          className={[
            'rounded-2xl border px-4 py-3 text-left transition',
            'min-h-[92px] sm:min-h-[104px]',
            customSelected ? 'border-black' : 'border-gray-300',
            'bg-white text-black',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Другое время</span>
            <span
              className={[
                'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0',
                customSelected ? 'border-black' : 'border-gray-400',
              ].join(' ')}
            >
              {customSelected && <span className="w-2 h-2 rounded-full bg-black" />}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-600">Выберите день и время</div>
        </button>
      </div>

      {(dateError || timeError) && (
        <p className="text-xs text-red-500">Пожалуйста, выберите дату и время.</p>
      )}

      {minLabelToday && <p className="text-xs text-gray-500">{minLabelToday}</p>}

      {safeDate && !isLoadingSettings && availableSlots.length === 0 && !minLabelToday && (
        <p className="text-xs text-gray-500">
          На выбранную дату не удалось подобрать интервалы времени. Выберите другую дату или время.
        </p>
      )}

      {/* Модалка "Другое время" */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-h-[80vh] rounded-t-3xl bg-white p-4 pb-5 sm:max-w-[560px] sm:rounded-3xl sm:mb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300 sm:hidden" />
              <h3 className="text-base font-semibold mb-3">
                {isPickup ? 'Выберите время самовывоза' : 'Выберите дату и время доставки'}
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
                {dateError && <p className="text-xs text-red-500">{dateError}</p>}
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
                {timeError && <p className="text-xs text-red-500">{timeError}</p>}
              </div>

              {/* Быстрые слоты */}
              {availableSlots.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {availableSlots.slice(0, 8).map(slot => (
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

              {minLabelToday && <p className="text-xs text-gray-500 mb-3">{minLabelToday}</p>}

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
