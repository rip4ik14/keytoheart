// ✅ Путь: app/admin/(protected)/life-tracker/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import LifeTrackerClient from './LifeTrackerClient';
import type { LifeTrackerEntry, LifeTrackerSettings, TrainingType } from './types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toInt(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toBool(value: unknown) {
  return value === true || value === 'true' || value === '1' || value === 1;
}

function normalizeNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7)
    .sort((a, b) => a - b);
}

function normalizeEntry(row: any): LifeTrackerEntry {
  return {
    id: toInt(row?.id),
    entry_date: String(row?.entry_date ?? ''),

    weight_kg: toNumber(row?.weight_kg),
    waist_cm: toNumber(row?.waist_cm),
    sleep_hours: toNumber(row?.sleep_hours),

    breakfast_done: toBool(row?.breakfast_done),
    steps: toInt(row?.steps),
    walk_km: toNumber(row?.walk_km),
    water_l: toNumber(row?.water_l),
    protein_g: toInt(row?.protein_g),
    calories_kcal: toNumber(row?.calories_kcal),

    resting_pulse: toInt(row?.resting_pulse, 0) || null,
    systolic: toInt(row?.systolic, 0) || null,
    diastolic: toInt(row?.diastolic, 0) || null,

    mood_score: toNumber(row?.mood_score),
    energy_score: toNumber(row?.energy_score),
    stress_score: toNumber(row?.stress_score),
    lower_back_pain_score: toNumber(row?.lower_back_pain_score),

    focus_blocks: toInt(row?.focus_blocks),
    deep_work_minutes: toInt(row?.deep_work_minutes),

    planned_training_type: (row?.planned_training_type ?? 'none') as TrainingType,

    gym_done: toBool(row?.gym_done),
    bjj_done: toBool(row?.bjj_done),
    walk_done: toBool(row?.walk_done),
    mobility_done: toBool(row?.mobility_done),
    stretching_done: toBool(row?.stretching_done),
    creatine_done: toBool(row?.creatine_done),

    protein_shakes: toInt(row?.protein_shakes),
    hookah_sessions: toInt(row?.hookah_sessions),
    notes: row?.notes ?? null,

    created_at: row?.created_at ?? null,
    updated_at: row?.updated_at ?? null,
  };
}

function normalizeSettings(row: any): LifeTrackerSettings {
  return {
    id: 1,

    sleep_goal_hours: toNumber(row?.sleep_goal_hours) ?? 7.75,
    protein_goal_g: toInt(row?.protein_goal_g, 140),
    steps_goal: toInt(row?.steps_goal, 6000),
    walk_goal_km: toNumber(row?.walk_goal_km) ?? 2.5,
    water_goal_l: toNumber(row?.water_l) ?? 2.3,
    focus_blocks_goal: toInt(row?.focus_blocks_goal, 2),
    deep_work_goal_minutes: toInt(row?.deep_work_goal_minutes, 90),
    hookah_limit_per_day: toInt(row?.hookah_limit_per_day, 0),
    breakfast_required: row?.breakfast_required !== false,

    weekly_gym_goal: toInt(row?.weekly_gym_goal, 2),
    weekly_bjj_goal: toInt(row?.weekly_bjj_goal, 2),
    weekly_walk_goal: toInt(row?.weekly_walk_goal, 5),
    weekly_mobility_goal: toInt(row?.weekly_mobility_goal, 4),

    gym_days: normalizeNumberArray(row?.gym_days ?? [1, 4]),
    bjj_days: normalizeNumberArray(row?.bjj_days ?? [2, 6]),
    walk_days: normalizeNumberArray(row?.walk_days ?? [1, 2, 3, 4, 5]),
    mobility_days: normalizeNumberArray(row?.mobility_days ?? [1, 3, 5, 7]),

    weight_goal_kg: toNumber(row?.weight_goal_kg),
    waist_goal_cm: toNumber(row?.waist_goal_cm),
  };
}

const defaultSettings: LifeTrackerSettings = {
  id: 1,
  sleep_goal_hours: 7.75,
  protein_goal_g: 140,
  steps_goal: 6000,
  walk_goal_km: 2.5,
  water_goal_l: 2.3,
  focus_blocks_goal: 2,
  deep_work_goal_minutes: 90,
  hookah_limit_per_day: 0,
  breakfast_required: true,
  weekly_gym_goal: 2,
  weekly_bjj_goal: 2,
  weekly_walk_goal: 5,
  weekly_mobility_goal: 4,
  gym_days: [1, 4],
  bjj_days: [2, 6],
  walk_days: [1, 2, 3, 4, 5],
  mobility_days: [1, 3, 5, 7],
  weight_goal_kg: 80,
  waist_goal_cm: 90,
};

export default async function LifeTrackerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) redirect('/admin/login?error=no-session');

  const isValidToken = await verifyAdminJwt(token);
  if (!isValidToken) redirect('/admin/login?error=invalid-session');

  let entries: LifeTrackerEntry[] = [];
  let settings = defaultSettings;

  try {
    const sb = supabaseAdmin as any;

    const [{ data: entriesData, error: entriesError }, { data: settingsData, error: settingsError }] =
      await Promise.all([
        sb
          .from('life_tracker_entries')
          .select('*')
          .order('entry_date', { ascending: true })
          .limit(730),
        sb
          .from('life_tracker_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle(),
      ]);

    if (entriesError) throw entriesError;
    if (settingsError) throw settingsError;

    entries = Array.isArray(entriesData) ? entriesData.map(normalizeEntry) : [];
    settings = settingsData ? normalizeSettings(settingsData) : defaultSettings;
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error('[life-tracker/page] load error ->', error?.message || error);
  }

  return <LifeTrackerClient initialEntries={entries} initialSettings={settings} />;
}