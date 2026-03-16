// app/cart/hooks/useStoreSettings.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchStoreSettingsCached,
  type StoreSettings,
} from '@/lib/store-settings-client';

export function useStoreSettings() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStoreSettings = async () => {
      setIsStoreSettingsLoading(true);
      try {
        const data = await fetchStoreSettingsCached();

        if (!isMounted) return;

        setStoreSettings(data);
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
