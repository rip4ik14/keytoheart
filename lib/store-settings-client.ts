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

const FALLBACK_DAY: DaySchedule = { start: '09:00', end: '18:00', enabled: true };

export const transformSchedule = (schedule: unknown): Record<string, DaySchedule> => {
  const result: Record<string, DaySchedule> = daysOfWeek.reduce((acc, day) => {
    acc[day] = { ...FALLBACK_DAY };
    return acc;
  }, {} as Record<string, DaySchedule>);

  if (typeof schedule !== 'object' || schedule === null) return result;

  for (const [key, value] of Object.entries(schedule)) {
    if (!daysOfWeek.includes(key as (typeof daysOfWeek)[number])) continue;
    if (typeof value !== 'object' || value === null) continue;

    const maybe = value as Partial<DaySchedule>;
    if (typeof maybe.start === 'string' && typeof maybe.end === 'string') {
      result[key] = {
        start: maybe.start,
        end: maybe.end,
        enabled: maybe.enabled ?? true,
      };
    }
  }

  return result;
};

const STORE_SETTINGS_TTL_MS = 5 * 60 * 1000;
let storeSettingsCache: { data: StoreSettings; expiresAt: number } | null = null;
let inFlightSettingsPromise: Promise<StoreSettings | null> | null = null;

export async function fetchStoreSettingsCached(): Promise<StoreSettings | null> {
  const now = Date.now();
  if (storeSettingsCache && now < storeSettingsCache.expiresAt) {
    return storeSettingsCache.data;
  }

  if (inFlightSettingsPromise) {
    return inFlightSettingsPromise;
  }

  inFlightSettingsPromise = (async () => {
    try {
      const res = await fetch('/api/store-settings');
      const json = await res.json();

      if (!res.ok || !json?.success) return null;

      const normalized: StoreSettings = {
        order_acceptance_enabled: json.data.order_acceptance_enabled ?? false,
        banner_message: json.data.banner_message ?? null,
        banner_active: json.data.banner_active ?? false,
        order_acceptance_schedule: transformSchedule(json.data.order_acceptance_schedule),
        store_hours: transformSchedule(json.data.store_hours),
      };

      storeSettingsCache = {
        data: normalized,
        expiresAt: Date.now() + STORE_SETTINGS_TTL_MS,
      };

      return normalized;
    } catch {
      return null;
    } finally {
      inFlightSettingsPromise = null;
    }
  })();

  return inFlightSettingsPromise;
}
