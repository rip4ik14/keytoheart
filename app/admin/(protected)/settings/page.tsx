'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import type { Database, Json } from '@/lib/supabase/types_new';

interface RawDaySchedule {
  start: string;
  end: string;
  enabled?: boolean;
}
interface DaySchedule extends RawDaySchedule {
  enabled: boolean;
}
interface StoreSettings {
  id: number;
  order_acceptance_enabled: boolean;
  banner_message: string | null;
  banner_active: boolean;
  order_acceptance_schedule: Record<string, DaySchedule>;
  store_hours: Record<string, DaySchedule>;
}

const daysOfWeek = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
];

const defaultSchedule: Record<string, DaySchedule> = daysOfWeek.reduce((acc, day) => {
  acc[day.key] = { start: '09:00', end: '18:00', enabled: true };
  return acc;
}, {} as Record<string, DaySchedule>);

const defaultSettings: StoreSettings = {
  id: 0,
  order_acceptance_enabled: false,
  banner_message: null,
  banner_active: false,
  order_acceptance_schedule: defaultSchedule,
  store_hours: defaultSchedule,
};

const transformSchedule = (schedule: unknown): Record<string, DaySchedule> => {
  const result: Record<string, DaySchedule> = { ...defaultSchedule };
  if (typeof schedule !== 'object' || schedule === null) return result;
  for (const [key, value] of Object.entries(schedule)) {
    if (daysOfWeek.some(day => day.key === key) && typeof value === 'object' && value !== null) {
      const { start, end, enabled } = value as any;
      if (
        typeof start === 'string' &&
        typeof end === 'string'
      ) {
        result[key] = {
          start,
          end,
          enabled: enabled === undefined ? true : !!enabled,
        };
      }
    }
  }
  return result;
};

export default function AdminSettingsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <p className="text-center text-red-500">
        Ошибка конфигурации: Проверьте переменные окружения Supabase (URL и ANON_KEY)
      </p>
    );
  }

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();
      if (error) throw new Error(`Supabase error: ${JSON.stringify(error)}`);
      if (!data) throw new Error('Настройки магазина не найдены');
      const transformedData: StoreSettings = {
        id: data.id,
        order_acceptance_enabled: data.order_acceptance_enabled ?? false,
        banner_message: data.banner_message,
        banner_active: data.banner_active ?? false,
        order_acceptance_schedule: transformSchedule(data.order_acceptance_schedule),
        store_hours: transformSchedule(data.store_hours),
      };
      setSettings(transformedData);
      setOriginalSettings(transformedData);
    } catch (error: any) {
      toast.error('Ошибка загрузки настроек: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          order_acceptance_enabled: settings.order_acceptance_enabled,
          banner_message: settings.banner_message,
          banner_active: settings.banner_active,
          order_acceptance_schedule: settings.order_acceptance_schedule as unknown as Json,
          store_hours: settings.store_hours as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw new Error(`Ошибка сохранения: ${error.message}`);

      setOriginalSettings(settings);
      toast.success('Настройки сохранены');
    } catch (error: any) {
      toast.error('Ошибка сохранения настроек: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      toast.success('Изменения отменены');
    }
  };

  const handleScheduleChange = (
    type: 'order_acceptance_schedule' | 'store_hours',
    day: string,
    field: 'start' | 'end' | 'enabled',
    value: string | boolean
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const schedule = { ...(prev[type] as Record<string, DaySchedule>) };
      const currentDay = { ...schedule[day] };
      (currentDay as any)[field] = value;
      if ((field === 'start' || field === 'end') && currentDay.start && currentDay.end) {
        if (currentDay.start >= currentDay.end) {
          toast.error('Время окончания должно быть позже времени начала');
          return prev;
        }
      }
      schedule[day] = currentDay;
      return { ...prev, [type]: schedule };
    });
  };

  const enable24HourOrderAcceptance = () => {
    const updatedSchedule = daysOfWeek.reduce((acc, day) => {
      acc[day.key] = { start: '00:00', end: '23:59', enabled: true };
      return acc;
    }, {} as Record<string, DaySchedule>);
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            order_acceptance_enabled: true,
            order_acceptance_schedule: updatedSchedule,
          }
        : prev
    );
    toast.success('Приём заказов установлен на 24/7');
  };

  const copyScheduleToAllDays = (type: 'order_acceptance_schedule' | 'store_hours', sourceDay: string) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const sourceSchedule = (prev[type] as Record<string, DaySchedule>)[sourceDay];
      const updatedSchedule = daysOfWeek.reduce((acc, day) => {
        acc[day.key] = { ...sourceSchedule };
        return acc;
      }, {} as Record<string, DaySchedule>);
      return { ...prev, [type]: updatedSchedule };
    });
    toast.success(
      `Расписание скопировано на все дни для ${type === 'order_acceptance_schedule' ? 'приёма заказов' : 'графика доставки'}`
    );
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!settings || !originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          className="text-gray-500 text-2xl"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Image src="/icons/spinner.svg" alt="Загрузка" width={24} height={24} className="animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!settings) {
    return <p className="text-center text-gray-500">Не удалось загрузить настройки</p>;
  }

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Настройки магазина</h1>
        {hasUnsavedChanges && (
          <span className="text-sm text-gray-600 italic">Есть несохранённые изменения</span>
        )}
      </div>

      {/* Приём заказов */}
      <motion.section
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Приём заказов</h2>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.order_acceptance_enabled}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, order_acceptance_enabled: e.target.checked } : prev
                )
              }
              className="form-checkbox h-5 w-5 text-black"
            />
            <span className="text-sm text-gray-600">Приём заказов включён</span>
          </label>
          <motion.button
            onClick={enable24HourOrderAcceptance}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Включить 24/7
          </motion.button>
        </div>

        <h3 className="text-sm font-medium text-gray-700 mb-2">Расписание приёма заказов</h3>
        <p className="text-xs text-gray-500 mb-4">
          Укажите время, в течение которого магазин принимает заказы (например, с 00:00 до 23:59).
        </p>
        {daysOfWeek.map((day) => (
          <motion.div key={day.key} className="flex items-center gap-4 mb-2" variants={itemVariants}>
            <span className="w-28 text-sm text-gray-600">{day.label}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(settings.order_acceptance_schedule as Record<string, DaySchedule>)[day.key]?.enabled ?? true}
                onChange={(e) =>
                  handleScheduleChange('order_acceptance_schedule', day.key, 'enabled', e.target.checked)
                }
                className="form-checkbox h-5 w-5 text-black"
              />
              <span className="text-sm text-gray-600">Включён</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={(settings.order_acceptance_schedule as Record<string, DaySchedule>)[day.key]?.start || '09:00'}
                onChange={(e) =>
                  handleScheduleChange('order_acceptance_schedule', day.key, 'start', e.target.value)
                }
                disabled={
                  !((settings.order_acceptance_schedule as Record<string, DaySchedule>)[day.key]?.enabled ?? true)
                }
                className={`border border-gray-300 rounded-lg px-3 py-1 ${
                  !((settings.order_acceptance_schedule as Record<string, DaySchedule>)[day.key]?.enabled ?? true)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              />
              <span className="text-gray-500">-</span>
              <input
                type="time"
                value={(settings.order_acceptance_schedule as Record<string, DaySchedule>)[day.key]?.end || '18:00'}
                onChange={(e) =>
                  handleScheduleChange('order_acceptance_schedule', day.key, 'end', e.target.value)
                }
                disabled={
                  !((settings.order_acceptance_schedule as Record<string, DaySchedule>)[day.key]?.enabled ?? true)
                }
                className={`border border-gray-300 rounded-lg px-3 py-1 ${
                  !((settings.order_acceptance_schedule as Record<string, DaySchedule>)[day.key]?.enabled ?? true)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              />
              <motion.button
                onClick={() => copyScheduleToAllDays('order_acceptance_schedule', day.key)}
                className="text-gray-500 hover:text-gray-700"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Image src="/icons/copy.svg" alt="Скопировать" width={16} height={16} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* График работы магазина (доставки) */}
      <motion.section
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">График работы магазина (доставка)</h2>
        <p className="text-xs text-gray-500 mb-4">
          Укажите часы, в течение которых возможна доставка (например, с 10:00 до 20:00).
        </p>
        {daysOfWeek.map((day) => (
          <motion.div key={day.key} className="flex items-center gap-4 mb-2" variants={itemVariants}>
            <span className="w-28 text-sm text-gray-600">{day.label}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(settings.store_hours as Record<string, DaySchedule>)[day.key]?.enabled ?? true}
                onChange={(e) =>
                  handleScheduleChange('store_hours', day.key, 'enabled', e.target.checked)
                }
                className="form-checkbox h-5 w-5 text-black"
              />
              <span className="text-sm text-gray-600">Включён</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={(settings.store_hours as Record<string, DaySchedule>)[day.key]?.start || '09:00'}
                onChange={(e) =>
                  handleScheduleChange('store_hours', day.key, 'start', e.target.value)
                }
                disabled={
                  !((settings.store_hours as Record<string, DaySchedule>)[day.key]?.enabled ?? true)
                }
                className={`border border-gray-300 rounded-lg px-3 py-1 ${
                  !((settings.store_hours as Record<string, DaySchedule>)[day.key]?.enabled ?? true)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              />
              <span className="text-gray-500">-</span>
              <input
                type="time"
                value={(settings.store_hours as Record<string, DaySchedule>)[day.key]?.end || '18:00'}
                onChange={(e) =>
                  handleScheduleChange('store_hours', day.key, 'end', e.target.value)
                }
                disabled={
                  !((settings.store_hours as Record<string, DaySchedule>)[day.key]?.enabled ?? true)
                }
                className={`border border-gray-300 rounded-lg px-3 py-1 ${
                  !((settings.store_hours as Record<string, DaySchedule>)[day.key]?.enabled ?? true)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              />
              <motion.button
                onClick={() => copyScheduleToAllDays('store_hours', day.key)}
                className="text-gray-500 hover:text-gray-700"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Image src="/icons/copy.svg" alt="Скопировать" width={16} height={16} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* Баннер временного закрытия */}
      <motion.section
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        variants={itemVariants}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Баннер временного закрытия</h2>
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={settings.banner_active}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, banner_active: e.target.checked } : prev
              )
            }
            className="form-checkbox h-5 w-5 text-black"
          />
          <span className="text-sm text-gray-600">Показывать баннер</span>
        </label>
        <div className="mb-4">
          <label htmlFor="bannerMessage" className="text-sm font-medium mb-1 block text-gray-700">
            Текст баннера
          </label>
          <textarea
            id="bannerMessage"
            value={settings.banner_message || ''}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, banner_message: e.target.value || null } : prev
              )
            }
            placeholder="Например: Магазин временно не принимает заказы"
            className="w-full border border-gray-300 rounded-lg p-2 min-h-[80px]"
          />
        </div>
        {settings.banner_active && settings.banner_message && (
          <motion.div
            className="bg-gray-100 p-4 rounded-lg text-center text-sm text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p>{settings.banner_message}</p>
          </motion.div>
        )}
      </motion.section>

      {/* Кнопки сохранения и отмены */}
      <motion.div className="sticky bottom-4 bg-white pt-4 border-t flex gap-4" variants={itemVariants}>
        <motion.button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={`flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-300 ${
            isSaving || !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-2">
              <Image src="/icons/spinner.svg" alt="Загрузка" width={20} height={20} className="animate-spin" />
              Сохранение...
            </div>
          ) : (
            'Сохранить настройки'
          )}
        </motion.button>
        <motion.button
          onClick={handleCancel}
          disabled={isSaving || !hasUnsavedChanges}
          className={`flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all duration-300 ${
            isSaving || !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Отменить
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
