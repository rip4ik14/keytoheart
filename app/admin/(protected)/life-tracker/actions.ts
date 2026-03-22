// ✅ Путь: app/admin/(protected)/life-tracker/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { LifeTrackerEntry, LifeTrackerSettings, TrainingType } from './types';

function toNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toInt(value: FormDataEntryValue | null, fallback = 0): number {
  if (value === null) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toBool(value: FormDataEntryValue | null): boolean {
  if (value === null) return false;
  const raw = String(value).toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'on';
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
    id: Number(row?.id ?? 0),
    entry_date: String(row?.entry_date ?? ''),
    weight_kg: row?.weight_kg === null ? null : Number(row?.weight_kg),
    waist_cm: row?.waist_cm === null ? null : Number(row?.waist_cm),
    sleep_hours: row?.sleep_hours === null ? null : Number(row?.sleep_hours),
    breakfast_done: Boolean(row?.breakfast_done),
    steps: Number(row?.steps ?? 0),
    walk_km: row?.walk_km === null ? null : Number(row?.walk_km),
    water_l: row?.water_l === null ? null : Number(row?.water_l),
    protein_g: Number(row?.protein_g ?? 0),
    calories_kcal: row?.calories_kcal === null ? null : Number(row?.calories_kcal),
    resting_pulse: row?.resting_pulse === null ? null : Number(row?.resting_pulse),
    systolic: row?.systolic === null ? null : Number(row?.systolic),
    diastolic: row?.diastolic === null ? null : Number(row?.diastolic),
    mood_score: row?.mood_score === null ? null : Number(row?.mood_score),
    energy_score: row?.energy_score === null ? null : Number(row?.energy_score),
    stress_score: row?.stress_score === null ? null : Number(row?.stress_score),
    lower_back_pain_score:
      row?.lower_back_pain_score === null ? null : Number(row?.lower_back_pain_score),
    focus_blocks: Number(row?.focus_blocks ?? 0),
    deep_work_minutes: Number(row?.deep_work_minutes ?? 0),
    planned_training_type: (row?.planned_training_type ?? 'none') as TrainingType,
    gym_done: Boolean(row?.gym_done),
    bjj_done: Boolean(row?.bjj_done),
    walk_done: Boolean(row?.walk_done),
    mobility_done: Boolean(row?.mobility_done),
    stretching_done: Boolean(row?.stretching_done),
    creatine_done: Boolean(row?.creatine_done),
    protein_shakes: Number(row?.protein_shakes ?? 0),
    hookah_sessions: Number(row?.hookah_sessions ?? 0),
    notes: row?.notes ?? null,
    created_at: row?.created_at ?? null,
    updated_at: row?.updated_at ?? null,
  };
}

function normalizeSettings(row: any): LifeTrackerSettings {
  return {
    id: 1,
    sleep_goal_hours: Number(row?.sleep_goal_hours ?? 7.75),
    protein_goal_g: Number(row?.protein_goal_g ?? 140),
    steps_goal: Number(row?.steps_goal ?? 6000),
    walk_goal_km: Number(row?.walk_goal_km ?? 2.5),
    water_goal_l: Number(row?.water_goal_l ?? 2.3),
    focus_blocks_goal: Number(row?.focus_blocks_goal ?? 2),
    deep_work_goal_minutes: Number(row?.deep_work_goal_minutes ?? 90),
    hookah_limit_per_day: Number(row?.hookah_limit_per_day ?? 0),
    breakfast_required: row?.breakfast_required !== false,
    weekly_gym_goal: Number(row?.weekly_gym_goal ?? 2),
    weekly_bjj_goal: Number(row?.weekly_bjj_goal ?? 2),
    weekly_walk_goal: Number(row?.weekly_walk_goal ?? 5),
    weekly_mobility_goal: Number(row?.weekly_mobility_goal ?? 4),
    gym_days: normalizeNumberArray(row?.gym_days ?? [1, 4]),
    bjj_days: normalizeNumberArray(row?.bjj_days ?? [2, 6]),
    walk_days: normalizeNumberArray(row?.walk_days ?? [1, 2, 3, 4, 5]),
    mobility_days: normalizeNumberArray(row?.mobility_days ?? [1, 3, 5, 7]),
    weight_goal_kg: row?.weight_goal_kg === null ? null : Number(row?.weight_goal_kg),
    waist_goal_cm: row?.waist_goal_cm === null ? null : Number(row?.waist_goal_cm),
  };
}

export async function saveLifeTrackerEntry(formData: FormData) {
  const entryDate = String(formData.get('entry_date') ?? '').trim();

  if (!entryDate) {
    return { ok: false, message: 'Не выбрана дата записи.' };
  }

  const payload = {
    entry_date: entryDate,
    weight_kg: toNumber(formData.get('weight_kg')),
    waist_cm: toNumber(formData.get('waist_cm')),
    sleep_hours: toNumber(formData.get('sleep_hours')),

    breakfast_done: toBool(formData.get('breakfast_done')),
    steps: toInt(formData.get('steps')),
    walk_km: toNumber(formData.get('walk_km')),
    water_l: toNumber(formData.get('water_l')),
    protein_g: toInt(formData.get('protein_g')),
    calories_kcal: toInt(formData.get('calories_kcal'), 0) || null,

    resting_pulse: toInt(formData.get('resting_pulse'), 0) || null,
    systolic: toInt(formData.get('systolic'), 0) || null,
    diastolic: toInt(formData.get('diastolic'), 0) || null,

    mood_score: toInt(formData.get('mood_score'), 0) || null,
    energy_score: toInt(formData.get('energy_score'), 0) || null,
    stress_score: toInt(formData.get('stress_score'), 0) || null,
    lower_back_pain_score: toInt(formData.get('lower_back_pain_score'), 0) || null,

    focus_blocks: toInt(formData.get('focus_blocks')),
    deep_work_minutes: toInt(formData.get('deep_work_minutes')),

    planned_training_type: String(formData.get('planned_training_type') ?? 'none') as TrainingType,

    gym_done: toBool(formData.get('gym_done')),
    bjj_done: toBool(formData.get('bjj_done')),
    walk_done: toBool(formData.get('walk_done')),
    mobility_done: toBool(formData.get('mobility_done')),
    stretching_done: toBool(formData.get('stretching_done')),
    creatine_done: toBool(formData.get('creatine_done')),

    protein_shakes: toInt(formData.get('protein_shakes')),
    hookah_sessions: toInt(formData.get('hookah_sessions')),
    notes: String(formData.get('notes') ?? '').trim() || null,
  };

  try {
    const sb = supabaseAdmin as any;

    const { data, error } = await sb
      .from('life_tracker_entries')
      .upsert(payload, { onConflict: 'entry_date' })
      .select('*')
      .single();

    if (error) throw error;

    revalidatePath('/admin/life-tracker');

    return {
      ok: true,
      message: 'Запись за день сохранена.',
      entry: normalizeEntry(data),
    };
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error('[life-tracker/actions] save entry error ->', error?.message || error);

    return {
      ok: false,
      message: error?.message || 'Не удалось сохранить запись.',
    };
  }
}

export async function deleteLifeTrackerEntry(formData: FormData) {
  const entryDate = String(formData.get('entry_date') ?? '').trim();

  if (!entryDate) {
    return { ok: false, message: 'Не выбрана дата удаления.' };
  }

  try {
    const sb = supabaseAdmin as any;
    const { error } = await sb.from('life_tracker_entries').delete().eq('entry_date', entryDate);

    if (error) throw error;

    revalidatePath('/admin/life-tracker');

    return {
      ok: true,
      message: 'Запись удалена.',
      entry_date: entryDate,
    };
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error('[life-tracker/actions] delete entry error ->', error?.message || error);

    return {
      ok: false,
      message: error?.message || 'Не удалось удалить запись.',
    };
  }
}

export async function saveLifeTrackerSettings(formData: FormData) {
  const payload = {
    id: 1,
    sleep_goal_hours: toNumber(formData.get('sleep_goal_hours')) ?? 7.75,
    protein_goal_g: toInt(formData.get('protein_goal_g'), 140),
    steps_goal: toInt(formData.get('steps_goal'), 6000),
    walk_goal_km: toNumber(formData.get('walk_goal_km')) ?? 2.5,
    water_goal_l: toNumber(formData.get('water_goal_l')) ?? 2.3,
    focus_blocks_goal: toInt(formData.get('focus_blocks_goal'), 2),
    deep_work_goal_minutes: toInt(formData.get('deep_work_goal_minutes'), 90),
    hookah_limit_per_day: toInt(formData.get('hookah_limit_per_day'), 0),
    breakfast_required: toBool(formData.get('breakfast_required')),
    weekly_gym_goal: toInt(formData.get('weekly_gym_goal'), 2),
    weekly_bjj_goal: toInt(formData.get('weekly_bjj_goal'), 2),
    weekly_walk_goal: toInt(formData.get('weekly_walk_goal'), 5),
    weekly_mobility_goal: toInt(formData.get('weekly_mobility_goal'), 4),
    gym_days: normalizeNumberArray(formData.getAll('gym_days')),
    bjj_days: normalizeNumberArray(formData.getAll('bjj_days')),
    walk_days: normalizeNumberArray(formData.getAll('walk_days')),
    mobility_days: normalizeNumberArray(formData.getAll('mobility_days')),
    weight_goal_kg: toNumber(formData.get('weight_goal_kg')),
    waist_goal_cm: toNumber(formData.get('waist_goal_cm')),
  };

  try {
    const sb = supabaseAdmin as any;

    const { data, error } = await sb
      .from('life_tracker_settings')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throw error;

    revalidatePath('/admin/life-tracker');

    return {
      ok: true,
      message: 'Цели и недельный шаблон сохранены.',
      settings: normalizeSettings(data),
    };
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error('[life-tracker/actions] save settings error ->', error?.message || error);

    return {
      ok: false,
      message: error?.message || 'Не удалось сохранить цели.',
    };
  }
}