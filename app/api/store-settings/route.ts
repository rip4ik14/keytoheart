import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// Определение типа DaySchedule
interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single();

    if (error) {
      process.env.NODE_ENV !== 'production' && console.error('Supabase error in store-settings:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Настройки не найдены' }, { status: 404 });
    }

    // Дефолтное расписание
    const defaultSchedule = {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '18:00', enabled: true },
      saturday: { start: '09:00', end: '18:00', enabled: true },
      sunday: { start: '09:00', end: '18:00', enabled: false },
    };

    // Преобразуем и объединяем расписание только если оно существует и является объектом
    const orderAcceptanceSchedule = data.order_acceptance_schedule
      ? { ...defaultSchedule, ...transformSchedule(data.order_acceptance_schedule) }
      : defaultSchedule;
    const storeHours = data.store_hours
      ? { ...defaultSchedule, ...transformSchedule(data.store_hours) }
      : defaultSchedule;

    return NextResponse.json({
      success: true,
      data: {
        order_acceptance_enabled: data.order_acceptance_enabled ?? false,
        banner_message: data.banner_message ?? null,
        banner_active: data.banner_active ?? false,
        order_acceptance_schedule: orderAcceptanceSchedule,
        store_hours: storeHours,
      },
    });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error in store-settings API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Вынесем transformSchedule в отдельную функцию для переиспользования
function transformSchedule(schedule: any): Record<string, DaySchedule> {
  const result: Record<string, DaySchedule> = {
    monday: { start: '09:00', end: '18:00', enabled: true },
    tuesday: { start: '09:00', end: '18:00', enabled: true },
    wednesday: { start: '09:00', end: '18:00', enabled: true },
    thursday: { start: '09:00', end: '18:00', enabled: true },
    friday: { start: '09:00', end: '18:00', enabled: true },
    saturday: { start: '09:00', end: '18:00', enabled: true },
    sunday: { start: '09:00', end: '18:00', enabled: false },
  };
  if (typeof schedule !== 'object' || schedule === null) return result;
  for (const [key, value] of Object.entries(schedule)) {
    if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(key) && typeof value === 'object' && value) {
      const { start, end, enabled } = value as any;
      if (typeof start === 'string' && typeof end === 'string' && (enabled === undefined || typeof enabled === 'boolean')) {
        result[key as keyof typeof result] = { start, end, enabled: enabled ?? true };
      }
    }
  }
  return result;
}
