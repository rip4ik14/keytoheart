// ✅ Путь: app/admin/(protected)/life-tracker/types.ts

export type TrainingType = 'none' | 'gym' | 'bjj' | 'walk' | 'mobility' | 'recovery';

export interface LifeTrackerEntry {
  id: number;
  entry_date: string;

  weight_kg: number | null;
  waist_cm: number | null;
  sleep_hours: number | null;

  breakfast_done: boolean;
  steps: number;
  walk_km: number | null;
  water_l: number | null;
  protein_g: number;
  calories_kcal: number | null;

  resting_pulse: number | null;
  systolic: number | null;
  diastolic: number | null;

  mood_score: number | null;
  energy_score: number | null;
  stress_score: number | null;
  lower_back_pain_score: number | null;

  focus_blocks: number;
  deep_work_minutes: number;

  planned_training_type: TrainingType;

  gym_done: boolean;
  bjj_done: boolean;
  walk_done: boolean;
  mobility_done: boolean;
  stretching_done: boolean;
  creatine_done: boolean;

  protein_shakes: number;
  hookah_sessions: number;
  notes: string | null;

  created_at: string | null;
  updated_at: string | null;
}

export interface LifeTrackerSettings {
  id: number;

  sleep_goal_hours: number;
  protein_goal_g: number;
  steps_goal: number;
  walk_goal_km: number;
  water_goal_l: number;
  focus_blocks_goal: number;
  deep_work_goal_minutes: number;
  hookah_limit_per_day: number;
  breakfast_required: boolean;

  weekly_gym_goal: number;
  weekly_bjj_goal: number;
  weekly_walk_goal: number;
  weekly_mobility_goal: number;

  gym_days: number[];
  bjj_days: number[];
  walk_days: number[];
  mobility_days: number[];

  weight_goal_kg: number | null;
  waist_goal_cm: number | null;
}