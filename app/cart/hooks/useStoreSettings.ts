// app/cart/hooks/useStoreSettings.ts
'use client';

import { useEffect, useMemo, useState } from 'react';

export interface DaySchedule {
  start: string;
  end: string;
  enabled?: boolean;
}

export interface StoreSettings {
  order_acceptance_enabled: boolean;
  banner_message: string | null;
  banner_active: boolean;
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

const transformSchedule = (schedule: any): Record<string, DaySchedule> => {
  const result: Record<string, DaySchedule> = daysOfWeek.reduce((acc, day) => {
    acc[day] = { start: '09:00', end: '18:00', enabled: true };
    return acc;
  }, {} as Record<string, DaySchedule>);

  if (typeof schedule !== 'object' || schedule === null) return result;

  for (const [key, value] of Object.entries(schedule)) {
    if (!daysOfWeek.includes(key as any)) continue;
    if (typeof value !== 'object' || value === null) continue;

    const { start, end, enabled } = value as any;
    if (typeof start === 'string' && typeof end === 'string') {
      result[key] = {
        start,
        end,
        enabled: enabled ?? true,
      };
    }
  }

  return result;
};

export function useStoreSettings() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStoreSettings = async () => {
      setIsStoreSettingsLoading(true);
      try {
        const res = await fetch('/api/store-settings');
        const json = await res.json();

        if (!isMounted) return;

        if (res.ok && json.success) {
          setStoreSettings({
            order_acceptance_enabled: json.data.order_acceptance_enabled ?? false,
            banner_message: json.data.banner_message ?? null,
            banner_active: json.data.banner_active ?? false,
            order_acceptance_schedule: transformSchedule(json.data.order_acceptance_schedule),
            store_hours: transformSchedule(json.data.store_hours),
          });
        } else {
          setStoreSettings(null);
        }
      } catch {
        if (isMounted) setStoreSettings(null);
      } finally {
        if (isMounted) setIsStoreSettingsLoading(false);
      }
    };

    fetchStoreSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const canPlaceOrder = useMemo(() => {
    // без toast здесь
    if (!storeSettings || isStoreSettingsLoading) return true;
    return !!storeSettings.order_acceptance_enabled;
  }, [storeSettings, isStoreSettingsLoading]);

  const currentDaySchedule = useMemo(() => {
    if (!storeSettings || isStoreSettingsLoading) return null;

    const now = new Date();
    const dayKey = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

    return {
      orderSchedule: storeSettings.order_acceptance_schedule[dayKey] || null,
      storeHours: storeSettings.store_hours[dayKey] || null,
      currentDay: dayKey,
    };
  }, [storeSettings, isStoreSettingsLoading]);

  return {
    storeSettings,
    isStoreSettingsLoading,
    canPlaceOrder,
    currentDaySchedule,
  };
}
